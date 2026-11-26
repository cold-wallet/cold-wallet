// BackupImportFields — the token textarea, the backup-PIN field (shown once a PIN-protected
// backup is detected) and the error line. Used by Settings → Import and the welcome screen.
import React from "react";
import type { useBackupImport } from "./useBackupImport";
import { PIN_MAX } from "../../pin/PinPad";

type ImportState = ReturnType<typeof useBackupImport>;

export default function BackupImportFields({ state, autoFocus }: { state: ImportState; autoFocus?: boolean }) {
    const { text, setText, pin, setPin, needsPin, errorText, pinHint, tokenLooksValid, error } = state;
    return (
        <>
            <textarea
                className={"import-area" + ((text && !tokenLooksValid) || (error && error !== 'wrong-pin' && error !== 'pin-required') ? " bad" : "")}
                placeholder="Paste your backup token here…"
                spellCheck={false} autoCorrect="off" autoCapitalize="off"
                aria-invalid={!!errorText && !needsPin}
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus={autoFocus}
            />
            {needsPin && (
                <div className="field import-pin">
                    <label htmlFor="backup-pin">Backup PIN</label>
                    <input
                        id="backup-pin"
                        type="password"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={PIN_MAX}
                        placeholder="PIN set when the backup was made"
                        className={error === 'wrong-pin' ? 'invalid' : ''}
                        aria-invalid={error === 'wrong-pin'}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        autoFocus
                    />
                    <small className="hint">{pinHint}</small>
                </div>
            )}
            {errorText && <p className="import-error" role="alert">{errorText}</p>}
        </>
    );
}
