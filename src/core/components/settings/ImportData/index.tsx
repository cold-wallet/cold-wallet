import UserDataHolder from "../../../domain/UserDataHolder";
import {Dispatch, SetStateAction} from "react";

export const dataImporter = {

    generateExportData(userDataHolder: UserDataHolder) {
        const data = {...userDataHolder}
        return Buffer.from(encodeURIComponent(JSON.stringify(data)), 'ascii').toString('base64');
    },

    readImportedData(data: string, setUserDataHolder: Dispatch<SetStateAction<UserDataHolder | null>>) {
        try {
            let text = Buffer.from(data, 'base64').toString('ascii');
            try {
                let parsed = JSON.parse(decodeURIComponent(text));
                setUserDataHolder(parsed);
                console.log("imported successfully")
            } catch (e) {
                console.error("error while parsing json string: ", text)
                console.error(e)
            }
        } catch (e) {
            console.error("error while decoding string: ", data)
            console.error(e)
        }
    }

}
