import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import PinSetup from './PinSetup';
import PinCodeOnLogin from '../unauthorized/PinCodeOnLogin';
import NotLoggedIn from '../unauthorized/NotLoggedIn';
import ChangePin from './ChangePin';
import type Props from '../Props';
import { NewerFormatError } from '../../services/PinVault';

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

describe('PinSetup when the browser fails', () => {
  it('says nothing was saved and lets the user start over', async () => {
    const onDone = vi.fn(async () => { throw new Error('out of memory'); });
    render(<PinSetup title="t" onDone={onDone} />);
    typePin('2580');
    typePin('2580');
    await waitFor(() => expect(status()).toMatch(/couldn't lock the wallet/));
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
  });
});

describe('creating a wallet', () => {
  function welcome(createWallet = vi.fn()) {
    const props = {
      termsAndPolicyAgreed: true,
      importOrExportSettingRequested: null,
      importWallet: vi.fn(),
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
  });

  it('stores nothing when the user goes back to the start screen', () => {
    const props = welcome();
    fireEvent.click(screen.getByText('Create new wallet'));
    typePin('2580');
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Try the demo')).toBeTruthy();
    expect(props.createWallet).not.toHaveBeenCalled();
  });
});

describe('lock screen', () => {
  function lock(correct = '2580') {
    const p = { unlock: vi.fn(async (pin: string) => pin === correct), startOver: vi.fn() };
    render(<PinCodeOnLogin props={p} />);
    return p;
  }

  it('never calls a browser failure a wrong PIN', async () => {
    const p = { unlock: vi.fn(async () => { throw new Error('out of memory'); }), startOver: vi.fn() };
    render(<PinCodeOnLogin props={p} />);
    typePin('2580');
    await waitFor(() => expect(status()).toMatch(/This browser couldn't check the PIN/));
    expect(status()).not.toMatch(/Wrong PIN/);
  });

  it('says why an open wallet was locked', () => {
    render(<PinCodeOnLogin props={{ unlock: vi.fn(), startOver: vi.fn(), lockReason: 'idle' }} />);
    expect(screen.getByText(/Locked after 5 minutes without activity/)).toBeTruthy();
  });

  it('tells a wallet from a newer version apart from a wrong PIN', async () => {
    const p = { unlock: vi.fn(async () => { throw new NewerFormatError(); }), startOver: vi.fn() };
    render(<PinCodeOnLogin props={p} />);
    typePin('2580');
    await waitFor(() => expect(status()).toMatch(/saved by a newer version/));
  });

  it('says when the PIN is wrong and passes the right one on', async () => {
    const p = lock();
    typePin('1111');
    await waitFor(() => expect(status()).toMatch(/Wrong PIN/));
    expect(screen.getByLabelText('0 of 8 digits entered')).toBeTruthy();
    typePin('2580');
    await waitFor(() => expect(p.unlock).toHaveBeenLastCalledWith('2580'));
  });

  it('explains a forgotten PIN and offers the start screen', () => {
    const p = lock();
    fireEvent.click(screen.getByText('Forgot PIN?'));
    expect(screen.getByText('Forgot the PIN?')).toBeTruthy();
    expect(screen.getByText(/The locked wallet stays until you do/)).toBeTruthy();
    fireEvent.click(screen.getByText('Go to start screen'));
    expect(p.startOver).toHaveBeenCalled();
  });

  it('goes back to the PIN on Cancel', () => {
    const p = lock();
    fireEvent.click(screen.getByText('Forgot PIN?'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Enter PIN-code')).toBeTruthy();
    expect(p.startOver).not.toHaveBeenCalled();
  });
});

describe('start screen over a locked wallet', () => {
  function startOver(createWallet = vi.fn()) {
    const onBack = vi.fn();
    const props = {
      termsAndPolicyAgreed: true,
      importOrExportSettingRequested: null,
      importWallet: vi.fn(),
      createWallet,
    } as unknown as Props;
    render(<NotLoggedIn props={props} replacing={{ onBack }} />);
    return { props, onBack };
  }

  it('says the locked wallet will be replaced and offers a way back', () => {
    const { onBack } = startOver();
    expect(screen.getByRole('note').textContent).toMatch(/replaces it for good/);
    fireEvent.click(screen.getByText('Back to unlock'));
    expect(onBack).toHaveBeenCalled();
  });

  it('replaces it only once the new PIN is confirmed', () => {
    const { props } = startOver();
    fireEvent.click(screen.getByText('Create new wallet'));
    expect(screen.getByText(/The locked wallet is replaced once you confirm it/)).toBeTruthy();
    typePin('9999');
    expect(props.createWallet).not.toHaveBeenCalled();
    typePin('9999');
    expect(props.createWallet).toHaveBeenCalledWith('9999');
  });
});

describe('Settings: change PIN', () => {
  function open(pinCode: string | null = '2580') {
    const props = {
      userData: { id: 'u', assets: [], settings: {} },
      userDataHolder: { pinCodeEncrypted: pinCode !== null },
      verifyPin: vi.fn(async (pin: string) => pin === pinCode),
      setWalletPin: vi.fn(async () => undefined),
      setPinCodeSettingsRequested: vi.fn(),
      setPinChanged: vi.fn(),
    } as unknown as Props;
    render(<ChangePin props={props} />);
    return props;
  }

  it('asks for the current PIN, then the new one twice, and only then saves', async () => {
    const props = open();
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
    typePin('1111');
    await waitFor(() => expect(status()).toMatch(/Wrong PIN/));
    typePin('2580');
    await screen.findByText('Step 2 of 3');
    typePin('4444');
    expect(screen.getByText('Step 3 of 3')).toBeTruthy();
    expect(props.setWalletPin).not.toHaveBeenCalled();
    typePin('4444');
    expect(props.setWalletPin).toHaveBeenCalledWith('4444');
    await waitFor(() => expect(props.setPinCodeSettingsRequested).toHaveBeenCalledWith(false));
    expect(props.setPinChanged).toHaveBeenCalledWith(true); // Settings mentions older backups
  });

  it('goes back to Settings without saving', async () => {
    const props = open();
    typePin('2580');
    await screen.findByText('Step 2 of 3');
    fireEvent.click(screen.getByText('Back'));
    expect(props.setPinCodeSettingsRequested).toHaveBeenCalledWith(false);
    expect(props.setWalletPin).not.toHaveBeenCalled();
  });
});
