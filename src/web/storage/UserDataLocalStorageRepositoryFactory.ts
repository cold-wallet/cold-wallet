import UserDataStorageRepositoryFactory from "./UserDataStorageRepositoryFactory";

const [
    UserDataLocalStorageRepository,
] = UserDataStorageRepositoryFactory(localStorage);

export default UserDataLocalStorageRepository

