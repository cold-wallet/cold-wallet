// BackupImportFields — the token textarea and the error line, plus the PIN dialog that opens over the
// import screen when the backup is PIN-protected. Used by Settings → Import and the welcome screen.
import React from "react";
import type { useBackupImport } from "./useBackupImport";
import PinDialog from "../../pin/PinDialog";
import { BACKUP_ERROR_TEXT } from "../../../services/userDataValidation";

type ImportState = ReturnType<typeof useBackupImport>;

export default function BackupImportFields({ state, autoFocus }: { state: ImportState; autoFocus?: boolean }) {
    const { text, setText, errorText, tokenLooksValid, error } = state;
    return (
        <>
            <textarea
                className={"import-area" + ((text && !tokenLooksValid) || error ? " bad" : "")}
                placeholder="Paste your backup token here…"
                spellCheck={false} autoCorrect="off" autoCapitalize="off"
                aria-invalid={!!errorText}
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus={autoFocus}
            />
            {errorText && <p className="import-error" role="alert">{errorText}</p>}
            {state.askingPin && (
                <PinDialog
                    title="Enter backup PIN"
                    intro="This backup is protected with the PIN the wallet had when it was exported. After restoring, the same PIN unlocks it on this device."
                    onBack={state.cancelPin}
                    busy={state.busy}
                    status={state.busy ? 'Checking…' : state.pinError ? BACKUP_ERROR_TEXT[state.pinError] : "Enter the backup's PIN."}
                    statusError={!!state.pinError && !state.busy}
                    pin={state.pin}
                    setPin={state.setPin}
                    onAccept={state.submitPin}
                />
            )}
        </>
    );
}
