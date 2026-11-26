import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import PinSetup from './PinSetup';
import PinCodeOnLogin from '../unauthorized/PinCodeOnLogin';
import NotLoggedIn from '../unauthorized/NotLoggedIn';
import ChangePin from './ChangePin';
import type Props from '../Props';

function typePin(pin: string) {
  for (const d of pin) fireEvent.click(screen.getByRole('button', { name: d }));
  fireEvent.click(screen.getByTitle('Confirm'));
}
const status = () => screen.getByRole('status').textContent || '';

describe('PinSetup', () => {
  it('hands over the PIN only after the second entry matches', () => {
    const onDone = vi.fn();
    render(<PinSetup title="t" onDone={onDone} />);
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
    typePin('2580');
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByText('Step 2 of 2')).toBeTruthy();
    expect(status()).toMatch(/same PIN again/);
    typePin('2580');
    expect(onDone).toHaveBeenCalledWith('2580');
  });

  it('starts over from the first step when the PINs differ', () => {
    const onDone = vi.fn();
    render(<PinSetup title="t" onDone={onDone} />);
    typePin('2580');
    typePin('2581');
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
    expect(status()).toMatch(/didn't match/);
    typePin('1111');
    typePin('1111');
    expect(onDone).toHaveBeenCalledWith('1111');
  });

  it('offers Back on both steps only when there is somewhere to go back to', () => {
    const onBack = vi.fn();
    const { unmount } = render(<PinSetup title="t" onBack={onBack} onDone={vi.fn()} />);
    fireEvent.click(screen.getByText('Back'));
    typePin('2580');
    fireEvent.click(screen.getByText('Back'));
    expect(onBack).toHaveBeenCalledTimes(2);
    unmount();
    render(<PinSetup title="t" onDone={vi.fn()} />);
    expect(screen.queryByText('Back')).toBeNull();
  });

  it('warns that a forgotten PIN means losing access', () => {
    render(<PinSetup title="t" onDone={vi.fn()} />);
    expect(screen.getByText(/access to this wallet is lost forever/)).toBeTruthy();
  });
});

describe('PinPad from the keyboard', () => {
  it('takes digits, Backspace and Enter, and ignores keys typed into a text field', () => {
    const onDone = vi.fn();
    render(<><input aria-label="other" /><PinSetup title="t" onDone={onDone} /></>);
    const key = (k: string) => fireEvent.keyDown(window, { key: k });
    for (const k of ['1', '2', '3', '9', 'Backspace', '4']) key(k);
    fireEvent.keyDown(screen.getByLabelText('other'), { key: '7' }); // typed into the field, not the PIN
    key('Enter');
    expect(screen.getByText('Step 2 of 2')).toBeTruthy();
    for (const k of '1234') key(k);
    fireEvent.keyDown(window, { key: '5', ctrlKey: true }); // shortcuts are left alone
    key('Enter');
    expect(onDone).toHaveBeenCalledWith('1234');
  });

  it('does not accept a PIN shorter than 4 digits on Enter', () => {
    render(<PinSetup title="t" onDone={vi.fn()} />);
    for (const k of ['1', '2', '3', 'Enter']) fireEvent.keyDown(window, { key: k });
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
  });
});

describe('creating a wallet', () => {
  function welcome(createWallet = vi.fn()) {
    const props = {
      termsAndPolicyAgreed: true,
      importOrExportSettingRequested: null,
      setUserDataHolder: vi.fn(),
      createWallet,
    } as unknown as Props;
    render(<NotLoggedIn props={props} />);
    return props;
  }

  it('asks for the PIN first and creates the wallet only once it is confirmed', () => {
    const props = welcome();
    fireEvent.click(screen.getByText('Create new wallet'));
    typePin('2580');
    expect(props.createWallet).not.toHaveBeenCalled();
    typePin('2580');
    expect(props.createWallet).toHaveBeenCalledWith('2580');
    expect(props.setUserDataHolder).not.toHaveBeenCalled();
  });

  it('stores nothing when the user goes back to the start screen', () => {
    const props = welcome();
    fireEvent.click(screen.getByText('Create new wallet'));
    typePin('2580');
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Try the demo')).toBeTruthy();
    expect(props.createWallet).not.toHaveBeenCalled();
    expect(props.setUserDataHolder).not.toHaveBeenCalled();
  });
});

describe('lock screen: forgot PIN', () => {
  function lock() {
    const p = { pinCodeEntered: null, setPinCodeEntered: vi.fn(), setPinCode: vi.fn(), createWallet: vi.fn() };
    render(<PinCodeOnLogin props={p} />);
    return p;
  }

  it('replaces the locked wallet only after a warning and a confirmed new PIN', () => {
    const p = lock();
    fireEvent.click(screen.getByText(/Forgot PIN\? Start a new empty wallet/));
    expect(screen.getByText('Start a new empty wallet?')).toBeTruthy();
    fireEvent.click(screen.getByText('Continue'));
    typePin('9999');
    typePin('9999');
    expect(p.createWallet).toHaveBeenCalledWith('9999');
  });

  it('keeps the locked wallet when the user cancels or backs out', () => {
    const p = lock();
    fireEvent.click(screen.getByText(/Forgot PIN/));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Enter PIN-code')).toBeTruthy();
    fireEvent.click(screen.getByText(/Forgot PIN/));
    fireEvent.click(screen.getByText('Continue'));
    typePin('9999');
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Enter PIN-code')).toBeTruthy();
    expect(p.createWallet).not.toHaveBeenCalled();
  });
});

describe('Settings: change PIN', () => {
  function open(pinCode: string | null = '2580') {
    const props = {
      userData: { id: 'u', assets: [], settings: {} },
      userDataHolder: { pinCodeEncrypted: pinCode !== null },
      pinCode,
      setWalletPin: vi.fn(),
      setPinCodeSettingsRequested: vi.fn(),
    } as unknown as Props;
    render(<ChangePin props={props} />);
    return props;
  }

  it('asks for the current PIN, then the new one twice, and only then saves', () => {
    const props = open();
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
    typePin('1111');
    expect(status()).toMatch(/Wrong PIN/);
    typePin('2580');
    expect(screen.getByText('Step 2 of 3')).toBeTruthy();
    typePin('4444');
    expect(screen.getByText('Step 3 of 3')).toBeTruthy();
    expect(props.setWalletPin).not.toHaveBeenCalled();
    typePin('4444');
    expect(props.setWalletPin).toHaveBeenCalledWith('4444');
    expect(props.setPinCodeSettingsRequested).toHaveBeenCalledWith(false);
  });

  it('goes back to Settings without saving', () => {
    const props = open();
    typePin('2580');
    fireEvent.click(screen.getByText('Back'));
    expect(props.setPinCodeSettingsRequested).toHaveBeenCalledWith(false);
    expect(props.setWalletPin).not.toHaveBeenCalled();
  });
});
