import StorageFactory from "../../domain/StorageFactory";
import MonobankUserDataResponse from "./MonobankUserDataResponse";
import {Dispatch, SetStateAction} from "react";

export default function MonobankUserDataStorage(storageFactory: StorageFactory)
    : [MonobankUserDataResponse | null, Dispatch<SetStateAction<MonobankUserDataResponse | null>>] {
    const [
        monobankUserData,
        setMonobankUserData
    ] = storageFactory.createStorageNullable<MonobankUserDataResponse>("monobankUserData");

    return [
        monobankUserData,
        setMonobankUserData,
    ]
}
