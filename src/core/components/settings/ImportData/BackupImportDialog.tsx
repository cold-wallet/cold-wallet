// BackupImportDialog — paste a backup token (and its PIN, if it has one) to restore a wallet, in a
// dialog of its own. Used by the welcome screen's "Import wallet" and by the lock screen's
// "Forgot PIN? → Restore from a backup". Nothing is replaced until the token decrypts and validates.
import React, { type ReactNode } from "react";
import Props from "../../Props";
import { useBackupImport } from "./useBackupImport";
import BackupImportFields from "./BackupImportFields";

interface BackupImportDialogProps {
    props: Props;
    title: string;
    intro: ReactNode;
    submitLabel: string;
    onCancel: () => void;
    onImported: () => void;
}

export default function BackupImportDialog({ props, title, intro, submitLabel, onCancel, onImported }: BackupImportDialogProps) {
    const state = useBackupImport(props, onImported);
    const { text, setText } = state;

    async function paste() {
        try {
            const t = await navigator.clipboard.readText();
            if (t) setText(t);
        } catch { /* clipboard unavailable */ }
    }

    return (
        <div className="scrim" onClick={onCancel}>
            <div className="dialog" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
                <h3>{title}</h3>
                <p className="data-desc">{intro}</p>
                <BackupImportFields state={state} autoFocus />
                <div className="data-actbar">
                    <button className="ghostbtn" onClick={paste}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
                        Paste
                    </button>
                    <span className="meta num">{text.trim().length.toLocaleString()} characters</span>
                </div>
                <div className="dialog__actions">
                    <button className="btn" onClick={onCancel}>Cancel</button>
                    <button className="btn btn--p" disabled={!state.canSubmit} onClick={state.submit}>{submitLabel}</button>
                </div>
            </div>
        </div>
    );
}
