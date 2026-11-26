import UserDataHolder from "../../../domain/UserDataHolder";
import {BackupResult, parseBackupToken} from "../../../services/userDataValidation";
import type {ImportedWallet} from "../../../services/UserDataService";

export const dataImporter = {

    generateExportData(userDataHolder: UserDataHolder) {
        const data = {...userDataHolder}
        return Buffer.from(encodeURIComponent(JSON.stringify(data)), 'ascii').toString('base64');
    },

    /**
     * Validate a backup token (decrypting it — with `pin` for a PIN-protected backup — and checking
     * the decrypted JSON) and, only if all of that succeeds, replace the stored wallet with it.
     */
    async readImportedData(
        data: string,
        importWallet: (imported: ImportedWallet, pin?: string) => Promise<void>,
        pin?: string,
    ): Promise<BackupResult> {
        const result = await parseBackupToken(data, pin);
        if (result.ok) {
            try {
                await importWallet(result.wallet, pin);
            } catch (e) {
                // e.g. the browser couldn't derive a key to re-save an older backup: nothing replaced
                console.warn("backup import failed:", e);
                return { ok: false, error: 'browser' };
            }
        } else if (result.error !== 'pin-required') {
            console.warn("backup import rejected:", result.error);
        }
        return result;
    }

}
