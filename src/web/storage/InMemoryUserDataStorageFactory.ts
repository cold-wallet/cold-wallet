import {Dispatch, SetStateAction} from "react";
import UserDataStorageFactory from "../../core/domain/UserDataStorageFactory";
import UserDataHolder from "../../core/domain/UserDataHolder";
import UserDataStorageRepositoryFactory from "./UserDataStorageRepositoryFactory";
import InMemoryStorage from "./InMemoryStorage";

// Mirror of UserDataLocalStorageFactory, but backed by a throwaway in-memory Storage. Used for
// demo sessions: the demo wallet lives only in memory, and the real localStorage userDataHolder
// is never read (so a logged-in user's real data is not even loaded) nor written.
const [InMemoryUserDataRepository] = UserDataStorageRepositoryFactory(new InMemoryStorage());

class InMemoryUserDataStorageFactory implements UserDataStorageFactory {
    createStorage(key: string, initializer: () => UserDataHolder):
        [UserDataHolder, Dispatch<SetStateAction<UserDataHolder>>] {
        return InMemoryUserDataRepository(key, initializer);
    }
}

const inMemoryUserDataStorageFactoryImpl: UserDataStorageFactory = new InMemoryUserDataStorageFactory();

export default inMemoryUserDataStorageFactoryImpl;
