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
                try {
                    storage.setItem(key, JSON.stringify(getter));
                } catch (e) {
                    // never let a storage write (e.g. QuotaExceededError) crash the app
                    console.warn(`storage: could not persist "${key}"`, e);
                }
            }
        }, [getter, key]);

        return [getter, setter,]
    }

    return [
        StorageRepository
    ]
}
