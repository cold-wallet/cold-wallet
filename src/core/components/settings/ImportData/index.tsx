import UserData from "../../../domain/UserData";
import {Dispatch, SetStateAction} from "react";

export const dataImporter = {

    generateExportData(userData: UserData) {
        const data = {...userData}
        return Buffer.from(encodeURIComponent(JSON.stringify(data)), 'ascii').toString('base64');
    },

    readImportedData(data: string, setUserData: Dispatch<SetStateAction<UserData | null>>) {
        try {
            let text = Buffer.from(data, 'base64').toString('ascii');
            try {
                let parsed = JSON.parse(decodeURIComponent(text));
                setUserData(parsed);
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
