import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { useBackupImport } from './useBackupImport';
import BackupImportFields from './BackupImportFields';
import { dataImporter } from './index';
import { sealUserDataHolder } from '../../../services/UserDataService';
import { newPinKey } from '../../../services/PinVault';
import UserData, { UserSettings } from '../../../domain/UserData';
import AssetDTO, { AssetType } from '../../../domain/AssetDTO';
import type Props from '../../Props';

function Harness({ props, onImported }: { props: Props; onImported: () => void }) {
  const state = useBackupImport(props, onImported);
  return (
    <>
      <BackupImportFields state={state} />
      <button disabled={!state.canSubmit} onClick={state.submit}>Restore</button>
    </>
  );
}

function makeProps() {
  return {
    setImportDataBuffer: vi.fn(),
    importWallet: vi.fn(async () => undefined),
    loadBinanceUserData: vi.fn(),
    loadMonobankUserData: vi.fn(),
    loadOkxUserData: vi.fn(),
  } as unknown as Props;
}

async function pinToken(pin: string) {
  const data = new UserData('u1', new UserSettings(), [new AssetDTO('a', 'EUR', '100', 'Savings', 2, AssetType.fiat)]);
  return dataImporter.generateExportData(await sealUserDataHolder(data, await newPinKey(pin)));
}

const textarea = () => screen.getByPlaceholderText(/Paste your backup token/) as HTMLTextAreaElement;
const restore = () => screen.getByText('Restore') as HTMLButtonElement;
const pinDialog = () => screen.queryByRole('dialog', { name: 'Enter backup PIN' });
const typePin = (pin: string) => pin.split('').forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));
const confirmPin = () => fireEvent.click(screen.getByTitle('Confirm'));
const status = () => screen.getByRole('status').textContent;
const statusBecomes = (re: RegExp) => waitFor(() => expect(status()).toMatch(re));

describe('backup import with a PIN', () => {
  it('asks for the PIN in the keypad dialog, refuses a wrong one, and imports only with the right one', async () => {
    const props = makeProps();
    const onImported = vi.fn();
    render(<Harness props={props} onImported={onImported} />);

    fireEvent.change(textarea(), { target: { value: await pinToken('4321') } });
    expect(pinDialog()).toBeNull();
    fireEvent.click(restore());

    // PIN dialog opens; nothing replaced yet; confirm disabled until 4 digits
    await waitFor(() => expect(pinDialog()).not.toBeNull());
    expect(status()).toMatch(/Enter the backup's PIN/);
    expect(props.importWallet).not.toHaveBeenCalled();
    typePin('12');
    expect((screen.getByTitle('Confirm') as HTMLButtonElement).disabled).toBe(true);

    // wrong PIN: error, entry cleared, nothing replaced, dialog stays
    typePin('11');
    confirmPin();
    await statusBecomes(/Wrong PIN/);
    expect(screen.getByLabelText('0 of 8 digits entered')).toBeTruthy();
    expect(props.importWallet).not.toHaveBeenCalled();
    expect(onImported).not.toHaveBeenCalled();

    // typing clears the error; the right PIN imports once, handing over the opened wallet
    typePin('4');
    expect(status()).toMatch(/Enter the backup's PIN/);
    typePin('321');
    confirmPin();
    await waitFor(() => expect(onImported).toHaveBeenCalledTimes(1));
    expect(props.importWallet).toHaveBeenCalledTimes(1);
    const [wallet, pin] = (props.importWallet as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(wallet.data.id).toBe('u1');
    expect(wallet.pinKey).toBeTruthy();
    expect(pin).toBe('4321');
  });

  it('takes the PIN from the keyboard, not the token field underneath', async () => {
    const props = makeProps();
    render(<Harness props={props} onImported={vi.fn()} />);
    const token = await pinToken('4321');
    fireEvent.change(textarea(), { target: { value: token } });
    fireEvent.click(restore());
    await waitFor(() => expect(pinDialog()).not.toBeNull());
    const dialog = pinDialog() as HTMLElement;
    expect(document.activeElement).toBe(dialog);
    '4321'.split('').forEach((key) => fireEvent.keyDown(dialog, { key }));
    fireEvent.keyDown(dialog, { key: 'Enter' });
    await waitFor(() => expect(props.importWallet).toHaveBeenCalled());
    expect(textarea().value).toBe(token);
  });

  it('Back closes the PIN dialog and keeps the token, with nothing replaced', async () => {
    const props = makeProps();
    render(<Harness props={props} onImported={vi.fn()} />);
    const token = await pinToken('4321');
    fireEvent.change(textarea(), { target: { value: token } });
    fireEvent.click(restore());
    await waitFor(() => expect(pinDialog()).not.toBeNull());
    typePin('12');
    fireEvent.click(screen.getByText('Back'));
    expect(pinDialog()).toBeNull();
    expect(textarea().value).toBe(token);
    expect(props.importWallet).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();

    // Restore again opens a fresh PIN dialog
    fireEvent.click(restore());
    await waitFor(() => expect(screen.getByLabelText('0 of 8 digits entered')).toBeTruthy());
  });

  it('shows the reason and keeps the dialog for a token that is not a backup', async () => {
    const props = makeProps();
    const onImported = vi.fn();
    render(<Harness props={props} onImported={onImported} />);
    fireEvent.change(textarea(), { target: { value: 'definitely-not-a-backup-token' } });
    fireEvent.click(restore());
    expect((await screen.findByRole('alert')).textContent).toMatch(/isn't a Cold Wallet backup/);
    expect(props.importWallet).not.toHaveBeenCalled();
    expect(onImported).not.toHaveBeenCalled();
  });
});
