import UserDataHolder from "../../../domain/UserDataHolder";
import {Dispatch, SetStateAction} from "react";
import {BackupResult, parseBackupToken} from "../../../services/userDataValidation";

export const dataImporter = {

    generateExportData(userDataHolder: UserDataHolder) {
        const data = {...userDataHolder}
        return Buffer.from(encodeURIComponent(JSON.stringify(data)), 'ascii').toString('base64');
    },

    /**
     * Validate a backup token (decrypting it — with `pin` for a PIN-protected backup — and checking
     * the decrypted JSON) and, only if all of that succeeds, replace the stored data with it.
     */
    readImportedData(data: string, setUserDataHolder: Dispatch<SetStateAction<UserDataHolder>>, pin?: string): BackupResult {
        const result = parseBackupToken(data, pin);
        if (result.ok) {
            setUserDataHolder(result.holder);
        } else if (result.error !== 'pin-required') {
            console.warn("backup import rejected:", result.error);
        }
        return result;
    }

}
