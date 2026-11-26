// useBackupImport — shared state + flow for both import screens (Settings → Import and the welcome
// screen's "Import wallet"): paste a token, enter the backup's PIN when it has one, and replace the
// stored data only after the token decrypted and validated (see parseBackupToken).
import { useState } from "react";
import Props from "../../Props";
import { dataImporter } from "./index";
import { BACKUP_ERROR_TEXT, type BackupError } from "../../../services/userDataValidation";
import { PIN_MAX, PIN_MIN } from "../../pin/PinPad";

export function useBackupImport(props: Props, onImported: () => void) {
    const [text, setTextState] = useState('');
    const [pin, setPinState] = useState('');
    const [needsPin, setNeedsPin] = useState(false);
    const [error, setError] = useState<BackupError | null>(null);

    function setText(value: string) {
        setTextState(value);
        props.setImportDataBuffer(value);
        // a different token: forget the previous token's PIN prompt and error
        setNeedsPin(false);
        setPinState('');
        setError(null);
    }
    function setPin(value: string) {
        setPinState(value.replace(/\D/g, '').slice(0, PIN_MAX));
        setError((e) => (e === 'wrong-pin' ? null : e));
    }

    const tokenLooksValid = text.trim().length > 8;
    const canSubmit = tokenLooksValid && (!needsPin || pin.length >= PIN_MIN);

    function submit() {
        if (!canSubmit) return;
        const result = dataImporter.readImportedData(text, props.setUserDataHolder, needsPin ? pin : undefined);
        if (!result.ok) {
            if (result.error === 'pin-required') setNeedsPin(true);
            setError(result.error);
            return;
        }
        props.loadBinanceUserData();
        props.loadMonobankUserData();
        props.loadOkxUserData();
        onImported();
    }

    // the PIN prompt is an instruction, not a failure: show it as a hint, not a red error
    const errorText = error && error !== 'pin-required' ? BACKUP_ERROR_TEXT[error] : null;
    const pinHint = needsPin ? BACKUP_ERROR_TEXT['pin-required'] : null;

    return { text, setText, pin, setPin, needsPin, error, errorText, pinHint, tokenLooksValid, canSubmit, submit };
}
