import StorageRepositoryFactory from "./StorageRepositoryFactory";

const [
    LocalStorageRepository,
    NullableStorageRepository
] = StorageRepositoryFactory(localStorage);

export default LocalStorageRepository
export const NullableLocalStorageRepository = NullableStorageRepository;

