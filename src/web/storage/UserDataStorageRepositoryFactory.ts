import {Dispatch, SetStateAction, useEffect, useState} from "react";
import UserDataHolder from "../../core/domain/UserDataHolder";

export interface StorageRepository {
    (key: string, initializer: () => UserDataHolder): [UserDataHolder, Dispatch<SetStateAction<UserDataHolder>>]
}

export default function UserDataStorageRepositoryFactory(storage: Storage):
    [StorageRepository] {
    function StorageRepository(key: string, initializer: () => UserDataHolder):
        [UserDataHolder, Dispatch<SetStateAction<UserDataHolder>>] {
        const storedData = storage.getItem(key);
        const initialState: UserDataHolder = storedData ? JSON.parse(storedData) : initializer();
        const [getter, setter] = useState(initialState);

        useEffect(() => {
            if (getter && !getter.demo) {
                storage.setItem(key, JSON.stringify(getter));
            }
        }, [getter, key]);

        return [getter, setter,]
    }

    return [
        StorageRepository
    ]
}
