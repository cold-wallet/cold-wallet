// useBackupImport — shared state + flow for both import screens (Settings → Import and the welcome
// screen's "Import wallet"): paste a token, press Import; a PIN-protected backup then asks for its
// PIN in the same keypad dialog as every other PIN screen. The stored data is replaced only after the
// token decrypted and validated (see parseBackupToken); Back on the PIN dialog returns to the token
// with nothing changed.
import { useState } from "react";
import Props from "../../Props";
import { dataImporter } from "./index";
import { BACKUP_ERROR_TEXT, type BackupError } from "../../../services/userDataValidation";
import { PIN_MIN } from "../../pin/PinPad";

export function useBackupImport(props: Props, onImported: () => void) {
    const [text, setTextState] = useState('');
    const [error, setError] = useState<BackupError | null>(null);
    // the PIN dialog: open once the token turned out to be PIN-protected
    const [askingPin, setAskingPin] = useState(false);
    const [pin, setPinState] = useState<string | null>(null);
    // why the last PIN didn't open the backup ('browser': this browser couldn't check it)
    const [pinError, setPinError] = useState<'wrong-pin' | 'browser' | null>(null);
    // a token or PIN is being checked
    const [busy, setBusy] = useState(false);

    function setText(value: string) {
        setTextState(value);
        props.setImportDataBuffer(value);
        setError(null);
    }
    function setPin(value: string | null) {
        setPinState(value);
        if (value) setPinError(null);
    }

    const tokenLooksValid = text.trim().length > 8;
    const canSubmit = tokenLooksValid && !busy;

    // The restored wallet opens unlocked (a backup with a PIN was just opened with it); one without
    // a PIN lands on the "Set a PIN-code" screen (see ColdWallet).
    function finish() {
        props.loadBinanceUserData();
        props.loadMonobankUserData();
        props.loadOkxUserData();
        onImported();
    }

    async function submit() {
        if (!canSubmit) return;
        setBusy(true);
        const result = await dataImporter.readImportedData(text, props.importWallet).finally(() => setBusy(false));
        if (result.ok) return finish();
        if (result.error === 'pin-required') {
            setError(null);
            setPinState(null);
            setPinError(null);
            setAskingPin(true);
        } else {
            setError(result.error);
        }
    }

    async function submitPin() {
        if (busy || !pin || pin.length < PIN_MIN) return;
        setBusy(true);
        const result = await dataImporter.readImportedData(text, props.importWallet, pin).finally(() => setBusy(false));
        if (result.ok) {
            setAskingPin(false);
            return finish();
        }
        setPinState(null);
        setPinError(result.error === 'browser' ? 'browser' : 'wrong-pin');
    }

    function cancelPin() {
        setAskingPin(false);
        setPinState(null);
        setPinError(null);
    }

    const errorText = error ? BACKUP_ERROR_TEXT[error] : null;

    return {
        text, setText, error, errorText, tokenLooksValid, canSubmit, submit,
        askingPin, pin, setPin, pinError, submitPin, cancelPin, busy,
    };
}
