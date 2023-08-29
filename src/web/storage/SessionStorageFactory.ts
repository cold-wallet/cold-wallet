import StorageFactory from "../../core/domain/StorageFactory";
import React, {Dispatch, SetStateAction} from "react";
import SessionStorageRepository, {NullableSessionStorageRepository} from "./SessionStorageRepository";

class SessionStorageFactory implements StorageFactory {
    createStorageNullable<T>(key: string): [(T | null), React.Dispatch<React.SetStateAction<T | null>>] {
        return NullableSessionStorageRepository<T | null>(key);
    }

    createStorage<T>(key: string, initializer: () => T): [T, Dispatch<SetStateAction<T>>] {
        return SessionStorageRepository(key, initializer);
    }
}

const sessionStorageFactoryImpl: StorageFactory = new SessionStorageFactory();

export default sessionStorageFactoryImpl;
