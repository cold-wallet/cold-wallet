import UserData from "../domain/UserData";
import UserDataHolder from "../domain/UserDataHolder";
import {Dispatch, SetStateAction, useMemo} from "react";
import useInterval from "../utils/useInterval";
import cypherService from "./CypherService";
import UserDataStorageFactory from "../domain/UserDataStorageFactory";
import {normalizeAmount} from "../utils/amount";

export const DEFAULT_PIN_CODE = "0123456789"
export const DELAY_BEFORE_RELOGIN = 5 * 60_000;
const unauthorizedId = "unauthorized";

function getPinCode(userData: UserData) {
    const userPinCode = userData.settings.pinCode;
    const pinCode = userPinCode ? userPinCode : DEFAULT_PIN_CODE;
    return {pinCode, pinCodeEncrypted: !!userPinCode}
}

/**
 * Bring decrypted user data up to today's rules without dropping anything: amounts are put in
 * canonical form (trailing zeros / exponents removed); values that can't be parsed are kept as-is
 * so nothing a user stored silently disappears. A missing assets list becomes empty.
 */
export function sanitizeUserData(data: UserData): UserData {
    if (!data || typeof data !== 'object') return data;
    if (!Array.isArray(data.assets)) return { ...data, assets: [] } as UserData;
    let changed = false;
    const assets = data.assets.map((a) => {
        if (!a || (typeof a.amount !== 'string' && typeof a.amount !== 'number')) return a;
        const canonical = normalizeAmount(a.amount);
        if (canonical === null || canonical === a.amount) return a;
        changed = true;
        return { ...a, amount: canonical };
    });
    return changed ? ({ ...data, assets } as UserData) : data;
}

export function initUserDataHolder(userData: UserData, demo: boolean = false): UserDataHolder {
    const {pinCode, pinCodeEncrypted} = getPinCode(userData);
    const encryptedData = cypherService.encrypt(userData, pinCode);
    return new UserDataHolder(pinCodeEncrypted, encryptedData, demo)
}

export default function UserDataService(
    {storageFactory, pinCode,}: {
        storageFactory: UserDataStorageFactory,
        pinCode: string | null,
    }
) {

    const [userDataHolder, setUserDataHolder]
        = storageFactory.createStorage(
        "userDataHolder", () => initUserDataHolder(new UserData(), true)
    );
    const userData: UserData = useMemo(() => {
        if (userDataHolder.pinCodeEncrypted && !pinCode) {
            return new UserData(unauthorizedId)
        } else {
            try {
                // Stored data may predate today's rules (or come from a PIN-protected backup that
                // could only be checked now): canonicalise amounts, never drop entries.
                return sanitizeUserData(cypherService.decrypt<UserData>(userDataHolder.encryptedData,
                    userDataHolder.pinCodeEncrypted ? pinCode || DEFAULT_PIN_CODE : DEFAULT_PIN_CODE))
            } catch (e: any) {
                return new UserData(unauthorizedId)
            }
        }
    }, [userDataHolder, pinCode])

    const loggedIn = useMemo(() => {
        return !!userData.id && userData.id !== unauthorizedId;
    }, [userData])

    const isDemoMode = useMemo(() => {
        return userDataHolder.demo
    }, [userData])

    const shouldEnterPinCode = useMemo(() => {
        return !isDemoMode && userDataHolder.pinCodeEncrypted
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
        isDemoMode,
        loggedIn,
    }
};
