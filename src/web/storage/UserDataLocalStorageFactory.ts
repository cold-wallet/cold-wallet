import {Dispatch, SetStateAction} from "react";
import UserDataStorageFactory from "../../core/domain/UserDataStorageFactory";
import UserDataHolder from "../../core/domain/UserDataHolder";
import UserDataLocalStorageRepositoryFactory from "./UserDataLocalStorageRepositoryFactory";

class UserDataLocalStorageFactory implements UserDataStorageFactory {
    createStorage(key: string, initializer: () => UserDataHolder):
        [UserDataHolder, Dispatch<SetStateAction<UserDataHolder>>] {
        return UserDataLocalStorageRepositoryFactory(key, initializer);
    }
}

const userDataStorageFactoryImpl: UserDataStorageFactory = new UserDataLocalStorageFactory();

export default userDataStorageFactoryImpl;
