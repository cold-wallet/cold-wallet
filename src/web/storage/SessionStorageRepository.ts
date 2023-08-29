import StorageRepositoryFactory from "./StorageRepositoryFactory";

const [
    SessionStorageRepository,
    NullableStorageRepository
] = StorageRepositoryFactory(sessionStorage);

export default SessionStorageRepository
export const NullableSessionStorageRepository = NullableStorageRepository;
