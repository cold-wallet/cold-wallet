import {Dispatch, SetStateAction} from "react";

export default interface StorageFactory {

    createStorageNullable<T>(key: string): [T | null, Dispatch<SetStateAction<T | null>>]

    createStorage<T>(key: string, initializer: () => T): [T, Dispatch<SetStateAction<T>>]

}
