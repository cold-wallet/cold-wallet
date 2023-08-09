import StorageFactory from "../../domain/StorageFactory";
import {Dispatch, SetStateAction} from "react";
import MonobankUserData from "./MonobankUserData";

export default function MonobankUserDataStorage(storageFactory: StorageFactory)
    : [MonobankUserData | null, Dispatch<SetStateAction<MonobankUserData | null>>] {
    const [
        monobankUserData,
        setMonobankUserData
    ] = storageFactory.createStorageNullable<MonobankUserData>("monobankUserData");

    return [
        monobankUserData,
        setMonobankUserData,
    ]
}
