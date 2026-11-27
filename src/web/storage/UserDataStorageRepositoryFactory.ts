import {Dispatch, SetStateAction, useEffect, useState} from "react";
import UserDataHolder from "../../core/domain/UserDataHolder";
import readStoredValue from "./readStoredValue";

export interface StorageRepository {
    (key: string, initializer: () => UserDataHolder): [UserDataHolder, Dispatch<SetStateAction<UserDataHolder>>]
}

export default function UserDataStorageRepositoryFactory(storage: Storage):
    [StorageRepository] {
    function StorageRepository(key: string, initializer: () => UserDataHolder):
        [UserDataHolder, Dispatch<SetStateAction<UserDataHolder>>] {
        const [getter, setter] = useState<UserDataHolder>(() => readStoredValue(storage, key, initializer));

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

        // Another tab saved the wallet: pick up its value (UserDataService decides what that means
        // for this tab). Storage events only fire in the other tabs, never in the one that wrote.
        useEffect(() => {
            if (typeof window === 'undefined') return;
            const onStorage = (e: StorageEvent) => {
                if (e.storageArea !== storage || (e.key !== key && e.key !== null)) return;
                setter(readStoredValue(storage, key, initializer));
            };
            window.addEventListener('storage', onStorage);
            return () => window.removeEventListener('storage', onStorage);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [key]);

        return [getter, setter,]
    }

    return [
        StorageRepository
    ]
}
