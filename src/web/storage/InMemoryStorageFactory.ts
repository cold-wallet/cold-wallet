import StorageFactory from "../../core/domain/StorageFactory";
import React, {Dispatch, SetStateAction} from "react";
import StorageRepositoryFactory from "./StorageRepositoryFactory";
import InMemoryStorage from "./InMemoryStorage";

// Mirror of LocalStorageFactory, but backed by a throwaway in-memory Storage instead of
// localStorage. Used for demo sessions so user-scoped data (integration *UserData) never
// touches real browser storage — nothing is read from or written to localStorage.
const [InMemoryRepository, NullableInMemoryRepository] = StorageRepositoryFactory(new InMemoryStorage());

class InMemoryStorageFactory implements StorageFactory {

    createStorageNullable<T>(key: string): [(T | null), React.Dispatch<React.SetStateAction<T | null>>] {
        return NullableInMemoryRepository<T | null>(key);
    }

    createStorage<T>(key: string, initializer: () => T): [T, Dispatch<SetStateAction<T>>] {
        return InMemoryRepository(key, initializer);
    }
}

const inMemoryStorageFactoryImpl: StorageFactory = new InMemoryStorageFactory();

export default inMemoryStorageFactoryImpl;
