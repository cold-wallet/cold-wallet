import UserData from "../domain/UserData";
import StorageFactory from "../domain/StorageFactory";
import UserDataHolder from "../domain/UserDataHolder";
import {Dispatch, SetStateAction, useMemo} from "react";
import useInterval from "../utils/useInterval";
import cypherService from "./CypherService";

const DEFAULT_PIN_CODE = "0123456789"
export const DELAY_BEFORE_RELOGIN = 5 * 60_000;
const unauthorizedId = "unauthorized";

function getPinCode(userData: UserData) {
    const userPinCode = userData.settings.pinCode;
    const pinCode = userPinCode ? userPinCode : DEFAULT_PIN_CODE;
    return {pinCode, pinCodeEncrypted: !!userPinCode}
}

export function initUserDataHolder(userData: UserData) {
    const {pinCode, pinCodeEncrypted} = getPinCode(userData);
    const encryptedData = cypherService.encrypt(userData, pinCode);
    return new UserDataHolder(pinCodeEncrypted, encryptedData)
}

export default function UserDataService(
    {storageFactory, pinCode,}: {
        storageFactory: StorageFactory,
        pinCode: string | null,
    }
) {

    const [userDataPlain] = storageFactory.createStorage<UserData>(
        "userData", () => new UserData()
    );
    const [userDataHolder, setUserDataHolder]
        = storageFactory.createStorage<UserDataHolder>(
        "userDataHolder", () => initUserDataHolder(userDataPlain)
    );
    const userData: UserData = useMemo(() => {
        if (userDataHolder.pinCodeEncrypted && !pinCode) {
            return new UserData(unauthorizedId)
        } else {
            try {
                return cypherService.decrypt<UserData>(userDataHolder.encryptedData,
                    userDataHolder.pinCodeEncrypted ? pinCode || DEFAULT_PIN_CODE : DEFAULT_PIN_CODE)
            } catch (e: any) {
                return new UserData(unauthorizedId)
            }
        }
    }, [userDataHolder, pinCode])

    const loggedIn = useMemo(() => {
        return !!userData.id && userData.id !== unauthorizedId;
    }, [userData])

    const shouldEnterPinCode = useMemo(() => {
        return userDataHolder.pinCodeEncrypted
            && ((userData.lastOnline && (Date.now() > ((userData.lastOnline || 0) + DELAY_BEFORE_RELOGIN)))
                || (!pinCode || userData.settings.pinCode !== pinCode))
    }, [userDataHolder, userData, pinCode])

    const pinCodeEnteredSuccessfully = useMemo(() => {
        return (loggedIn && !userData.settings.pinCode) || !!(pinCode && (pinCode === userData.settings.pinCode))
    }, [pinCode, userData, loggedIn])

    const setUserData = ((userData: UserData) => {
        const loggedIn = !!userData.id && userData.id !== unauthorizedId;
        if (!loggedIn || !pinCodeEnteredSuccessfully) {
            return
        }
        const userDataHolderNew = {...userDataHolder}
        userDataHolderNew.encryptedData = cypherService.encrypt(userData, userData.settings.pinCode || DEFAULT_PIN_CODE);
        userDataHolderNew.pinCodeEncrypted = !!userData.settings.pinCode
        setUserDataHolder(userDataHolderNew)
    }) as Dispatch<SetStateAction<UserData>>

    const delay = 60_000;
    const checkOnlineTimeToSave = () => {
        const now = Date.now();
        if ((((userData.lastOnline || 0) + delay) <= now) && loggedIn) {
            const newUserData = {...userData}
            newUserData.lastOnline = now
            setUserData(newUserData)
        }
    };
    checkOnlineTimeToSave()
    useInterval(checkOnlineTimeToSave, delay);

    return {
        userData, setUserData,
        userDataHolder, setUserDataHolder,
        shouldEnterPinCode,
        loggedIn,
    }
};
