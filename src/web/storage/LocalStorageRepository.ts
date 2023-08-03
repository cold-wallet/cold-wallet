import {Dispatch, SetStateAction, useEffect, useState} from "react";

export default function LocalStorageRepository<T>(key: string, initializer: () => T): [T, Dispatch<SetStateAction<T>>] {

    const storage: Storage = localStorage;
    const storedData = storage.getItem(key);
    const initialState: T = storedData ? JSON.parse(storedData) : initializer();
    const [getter, setter] = useState(initialState);

    useEffect(() => {
        getter && storage.setItem(key, JSON.stringify(getter));
    }, [getter]);

    return [getter, setter]
}

export function NullableLocalStorageRepository<T>(key: string): [T | null, Dispatch<SetStateAction<T | null>>] {
    return LocalStorageRepository<T | null>(key, () => null)
}
