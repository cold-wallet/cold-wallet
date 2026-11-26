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

/**
 * The PIN is the encryption key, so it is never stored inside the data it encrypts: whoever can
 * decrypt the data already knows it. Older wallets kept a copy in `settings.pinCode`; it is dropped
 * on the next save.
 */
function withoutStoredPin(userData: UserData): UserData {
    const settings = userData?.settings as (UserData["settings"] & { pinCode?: unknown }) | undefined;
    if (!settings || !("pinCode" in settings)) return userData;
    const rest = { ...settings };
    delete rest.pinCode;
    return { ...userData, settings: rest };
}

function encryptUserData(userData: UserData, pin: string | null): UserDataHolder["encryptedData"] {
    return cypherService.encrypt(withoutStoredPin(userData), pin || DEFAULT_PIN_CODE);
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

/** A new holder for `userData`, locked with `pin` (or with the built-in key when there is none). */
export function initUserDataHolder(userData: UserData, demo: boolean = false, pin: string | null = null): UserDataHolder {
    return new UserDataHolder(!!pin, encryptUserData(userData, pin), demo)
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

    // Locked when the data is PIN-encrypted and either the session PIN didn't decrypt it (missing or
    // wrong PIN) or the wallet has been idle longer than DELAY_BEFORE_RELOGIN.
    const shouldEnterPinCode = useMemo(() => {
        return !isDemoMode && userDataHolder.pinCodeEncrypted
            && (!loggedIn || (!!userData.lastOnline && Date.now() > userData.lastOnline + DELAY_BEFORE_RELOGIN))
    }, [userDataHolder, userData, loggedIn, isDemoMode])

    // The data decrypted, so the session PIN (if the wallet has one) is the right key to save with.
    const currentKey = userDataHolder.pinCodeEncrypted ? pinCode : null;

    const setUserData = ((userData: UserData) => {
        const loggedInNew = !!userData.id && userData.id !== unauthorizedId;
        if (!loggedIn || !loggedInNew) {
            return
        }
        setUserDataHolder({...userDataHolder, encryptedData: encryptUserData(userData, currentKey)})
    }) as Dispatch<SetStateAction<UserData>>

    /** Re-encrypt the wallet with a new PIN (setting the first one, or changing it). The caller puts
     *  the same PIN into the session so the wallet stays unlocked. */
    const setUserDataPin = (pin: string) => {
        if (!loggedIn) return;
        setUserDataHolder({...userDataHolder, pinCodeEncrypted: true, encryptedData: encryptUserData(userData, pin)})
    }

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
        userData, setUserData, setUserDataPin,
        userDataHolder, setUserDataHolder,
        shouldEnterPinCode,
        isDemoMode,
        loggedIn,
    }
};
