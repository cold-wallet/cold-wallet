import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { useBackupImport } from './useBackupImport';
import BackupImportFields from './BackupImportFields';
import { dataImporter } from './index';
import { initUserDataHolder } from '../../../services/UserDataService';
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
    setUserDataHolder: vi.fn(),
    setPinCode: vi.fn(),
    loadBinanceUserData: vi.fn(),
    loadMonobankUserData: vi.fn(),
    loadOkxUserData: vi.fn(),
  } as unknown as Props;
}

function pinToken(pin: string) {
  const settings = new UserSettings();
  settings.pinCode = pin;
  const holder = initUserDataHolder(new UserData('u1', settings, [new AssetDTO('a', 'EUR', '100', 'Savings', 2, AssetType.fiat)]));
  return dataImporter.generateExportData(holder);
}

const textarea = () => screen.getByPlaceholderText(/Paste your backup token/) as HTMLTextAreaElement;
const restore = () => screen.getByText('Restore') as HTMLButtonElement;
const pinDialog = () => screen.queryByRole('dialog', { name: 'Enter backup PIN' });
const typePin = (pin: string) => pin.split('').forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));
const confirmPin = () => fireEvent.click(screen.getByTitle('Confirm'));
const status = () => screen.getByRole('status').textContent;

describe('backup import with a PIN', () => {
  it('asks for the PIN in the keypad dialog, refuses a wrong one, and imports only with the right one', () => {
    const props = makeProps();
    const onImported = vi.fn();
    render(<Harness props={props} onImported={onImported} />);

    fireEvent.change(textarea(), { target: { value: pinToken('4321') } });
    expect(pinDialog()).toBeNull();
    fireEvent.click(restore());

    // PIN dialog opens; nothing replaced yet; confirm disabled until 4 digits
    expect(pinDialog()).not.toBeNull();
    expect(status()).toMatch(/Enter the backup's PIN/);
    expect(props.setUserDataHolder).not.toHaveBeenCalled();
    typePin('12');
    expect((screen.getByTitle('Confirm') as HTMLButtonElement).disabled).toBe(true);

    // wrong PIN: error, entry cleared, nothing replaced, dialog stays
    typePin('11');
    confirmPin();
    expect(status()).toMatch(/Wrong PIN/);
    expect(screen.getByLabelText('0 of 8 digits entered')).toBeTruthy();
    expect(props.setUserDataHolder).not.toHaveBeenCalled();
    expect(onImported).not.toHaveBeenCalled();

    // typing clears the error; the right PIN imports once
    typePin('4');
    expect(status()).toMatch(/Enter the backup's PIN/);
    typePin('321');
    confirmPin();
    expect(props.setUserDataHolder).toHaveBeenCalledTimes(1);
    expect(onImported).toHaveBeenCalledTimes(1);
    // unlocked with the PIN just typed, so the lock screen doesn't ask for it again
    expect(props.setPinCode).toHaveBeenCalledWith('4321');
  });

  it('takes the PIN from the keyboard, not the token field underneath', () => {
    const props = makeProps();
    render(<Harness props={props} onImported={vi.fn()} />);
    const token = pinToken('4321');
    fireEvent.change(textarea(), { target: { value: token } });
    fireEvent.click(restore());
    const dialog = pinDialog() as HTMLElement;
    expect(document.activeElement).toBe(dialog);
    '4321'.split('').forEach((key) => fireEvent.keyDown(dialog, { key }));
    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(textarea().value).toBe(token);
    expect(props.setPinCode).toHaveBeenCalledWith('4321');
  });

  it('Back closes the PIN dialog and keeps the token, with nothing replaced', () => {
    const props = makeProps();
    render(<Harness props={props} onImported={vi.fn()} />);
    const token = pinToken('4321');
    fireEvent.change(textarea(), { target: { value: token } });
    fireEvent.click(restore());
    typePin('12');
    fireEvent.click(screen.getByText('Back'));
    expect(pinDialog()).toBeNull();
    expect(textarea().value).toBe(token);
    expect(props.setUserDataHolder).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();

    // Restore again opens a fresh PIN dialog
    fireEvent.click(restore());
    expect(screen.getByLabelText('0 of 8 digits entered')).toBeTruthy();
  });

  it('shows the reason and keeps the dialog for a token that is not a backup', () => {
    const props = makeProps();
    const onImported = vi.fn();
    render(<Harness props={props} onImported={onImported} />);
    fireEvent.change(textarea(), { target: { value: 'definitely-not-a-backup-token' } });
    fireEvent.click(restore());
    expect(screen.getByRole('alert').textContent).toMatch(/isn't a Cold Wallet backup/);
    expect(props.setUserDataHolder).not.toHaveBeenCalled();
    expect(onImported).not.toHaveBeenCalled();
  });
});
