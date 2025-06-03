import {Dispatch, SetStateAction} from "react";
import UserDataHolder from "./UserDataHolder";

export default interface UserDataStorageFactory {

    createStorage(key: string, initializer: () => UserDataHolder):
        [UserDataHolder, Dispatch<SetStateAction<UserDataHolder>>]

}
