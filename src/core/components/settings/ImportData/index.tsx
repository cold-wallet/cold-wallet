import UserDataHolder from "../../../domain/UserDataHolder";
import {Dispatch, SetStateAction} from "react";
import {BackupResult, parseBackupToken} from "../../../services/userDataValidation";

export const dataImporter = {

    generateExportData(userDataHolder: UserDataHolder) {
        const data = {...userDataHolder}
        return Buffer.from(encodeURIComponent(JSON.stringify(data)), 'ascii').toString('base64');
    },

    /** Validate a backup token and, only if it is valid, replace the stored data with it. */
    readImportedData(data: string, setUserDataHolder: Dispatch<SetStateAction<UserDataHolder>>): BackupResult {
        const result = parseBackupToken(data);
        if (result.ok) {
            setUserDataHolder(result.holder);
        } else {
            console.warn("backup import rejected:", result.error);
        }
        return result;
    }

}
