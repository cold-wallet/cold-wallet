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
const pinField = () => screen.queryByLabelText('Backup PIN') as HTMLInputElement | null;

describe('backup import with a PIN', () => {
  it('asks for the PIN, refuses a wrong one, and imports only with the right one', () => {
    const props = makeProps();
    const onImported = vi.fn();
    render(<Harness props={props} onImported={onImported} />);

    fireEvent.change(textarea(), { target: { value: pinToken('4321') } });
    expect(pinField()).toBeNull();
    fireEvent.click(restore());

    // PIN prompt appears; nothing replaced yet; Restore disabled until 4 digits
    expect(pinField()).not.toBeNull();
    expect(screen.getByText(/protected with a PIN/)).toBeTruthy();
    expect(props.setUserDataHolder).not.toHaveBeenCalled();
    expect(restore().disabled).toBe(true);
    fireEvent.change(pinField()!, { target: { value: '12a' } });
    expect(pinField()!.value).toBe('12'); // digits only
    expect(restore().disabled).toBe(true);

    // wrong PIN: error, nothing replaced
    fireEvent.change(pinField()!, { target: { value: '1111' } });
    fireEvent.click(restore());
    expect(screen.getByRole('alert').textContent).toMatch(/Wrong PIN/);
    expect(props.setUserDataHolder).not.toHaveBeenCalled();
    expect(onImported).not.toHaveBeenCalled();

    // typing in the PIN clears the error; the right PIN imports once
    fireEvent.change(pinField()!, { target: { value: '432' } });
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.change(pinField()!, { target: { value: '4321' } });
    fireEvent.click(restore());
    expect(props.setUserDataHolder).toHaveBeenCalledTimes(1);
    expect(onImported).toHaveBeenCalledTimes(1);
    // unlocked with the PIN just typed, so the lock screen doesn't ask for it again
    expect(props.setPinCode).toHaveBeenCalledWith('4321');
  });

  it('forgets the PIN prompt when a different token is pasted', () => {
    render(<Harness props={makeProps()} onImported={vi.fn()} />);
    fireEvent.change(textarea(), { target: { value: pinToken('4321') } });
    fireEvent.click(restore());
    expect(pinField()).not.toBeNull();
    fireEvent.change(textarea(), { target: { value: 'something else entirely' } });
    expect(pinField()).toBeNull();
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
