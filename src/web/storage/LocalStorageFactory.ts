import StorageFactory from "../../core/domain/StorageFactory";
import React, {Dispatch, SetStateAction} from "react";
import LocalStorageRepository, {NullableLocalStorageRepository} from "./LocalStorageRepository";

class LocalStorageFactory implements StorageFactory {
    createStorageNullable<T>(key: string): [(T | null), React.Dispatch<React.SetStateAction<T | null>>] {
        return NullableLocalStorageRepository(key);
    }

    createStorage<T>(key: string, initializer: () => T): [T, Dispatch<SetStateAction<T>>] {
        return LocalStorageRepository(key, initializer);
    }
}

const storageFactoryImpl: StorageFactory = new LocalStorageFactory();

export default storageFactoryImpl;
