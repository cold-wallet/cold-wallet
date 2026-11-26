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
    const [wrongPin, setWrongPin] = useState(false);

    function setText(value: string) {
        setTextState(value);
        props.setImportDataBuffer(value);
        setError(null);
    }
    function setPin(value: string | null) {
        setPinState(value);
        if (value) setWrongPin(false);
    }

    const tokenLooksValid = text.trim().length > 8;
    const canSubmit = tokenLooksValid;

    function finish(withPin?: string) {
        // The backup's PIN was just typed in, so unlock with it instead of asking again. A backup
        // without a PIN lands on the "Set a PIN-code" screen (see ColdWallet).
        if (withPin) props.setPinCode(withPin);
        props.loadBinanceUserData();
        props.loadMonobankUserData();
        props.loadOkxUserData();
        onImported();
    }

    function submit() {
        if (!canSubmit) return;
        const result = dataImporter.readImportedData(text, props.setUserDataHolder);
        if (result.ok) return finish();
        if (result.error === 'pin-required') {
            setError(null);
            setPinState(null);
            setWrongPin(false);
            setAskingPin(true);
        } else {
            setError(result.error);
        }
    }

    function submitPin() {
        if (!pin || pin.length < PIN_MIN) return;
        const result = dataImporter.readImportedData(text, props.setUserDataHolder, pin);
        if (result.ok) {
            setAskingPin(false);
            return finish(pin);
        }
        setPinState(null);
        setWrongPin(true);
    }

    function cancelPin() {
        setAskingPin(false);
        setPinState(null);
        setWrongPin(false);
    }

    const errorText = error ? BACKUP_ERROR_TEXT[error] : null;

    return {
        text, setText, error, errorText, tokenLooksValid, canSubmit, submit,
        askingPin, pin, setPin, wrongPin, submitPin, cancelPin,
    };
}
