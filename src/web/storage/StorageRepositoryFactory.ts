import {Dispatch, SetStateAction, useEffect, useState} from "react";

export interface StorageRepository {
    <T>(key: string, initializer: () => T): [T, Dispatch<SetStateAction<T>>]
}

export interface NullableStorageRepository {
    <T>(key: string): [T | null, Dispatch<SetStateAction<T | null>>]
}

export default function StorageRepositoryFactory(storage: Storage):
    [StorageRepository, NullableStorageRepository] {
    function StorageRepository<T>(key: string, initializer: () => T): [T, Dispatch<SetStateAction<T>>] {
        const storedData = storage.getItem(key);
        const initialState: T = storedData ? JSON.parse(storedData) : initializer();
        const [getter, setter] = useState(initialState);

        useEffect(() => {
            // Persist any concrete value — including falsy ones like false / 0 / "".
            // Only the nullable variant's "absent" state (null/undefined) is skipped: the
            // initializer supplies defaults, so there's nothing useful to write for it.
            if (getter != null) {
                storage.setItem(key, JSON.stringify(getter));
            }
        }, [getter, key]);

        return [getter, setter,]
    }

    function NullableStorageRepository<T>(key: string): [T | null, Dispatch<SetStateAction<T | null>>] {
        return StorageRepository<T | null>(key, () => null)
    }

    return [
        StorageRepository,
        NullableStorageRepository
    ]
}
