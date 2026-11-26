import UserData from "../domain/UserData";
import UserDataHolder from "../domain/UserDataHolder";
import {Dispatch, SetStateAction, useCallback, useMemo, useRef, useState} from "react";
import cypherService from "./CypherService";
import UserDataStorageFactory from "../domain/UserDataStorageFactory";
import {normalizeAmount} from "../utils/amount";
import {isSealed, newPinKey, open, seal, WrongPinError, type PinKey} from "./PinVault";

export const DEFAULT_PIN_CODE = "0123456789"
const unauthorizedId = "unauthorized";

/**
 * The PIN is never stored inside the data it protects. Older wallets kept a copy in
 * `settings.pinCode`; it is dropped on the next save.
 */
function withoutStoredPin(userData: UserData): UserData {
    const settings = userData?.settings as (UserData["settings"] & { pinCode?: unknown }) | undefined;
    if (!settings || !("pinCode" in settings)) return userData;
    const rest = { ...settings };
    delete rest.pinCode;
    return { ...userData, settings: rest };
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

/** A holder for data without a PIN (the demo; a wallet before its PIN is set). */
export function initUserDataHolder(userData: UserData, demo = false): UserDataHolder {
    return new UserDataHolder(false, cypherService.encrypt(withoutStoredPin(userData), DEFAULT_PIN_CODE), demo)
}

/** A holder for data locked with a PIN-derived key. */
export async function sealUserDataHolder(userData: UserData, pinKey: PinKey): Promise<UserDataHolder> {
    return new UserDataHolder(true, await seal(withoutStoredPin(userData), pinKey), false)
}

/**
 * Open a PIN-locked holder. Data saved by older versions is read too; the caller re-saves it in
 * the current format. Throws WrongPinError on a wrong PIN or damaged data; any other error means
 * this browser couldn't do the work.
 */
export async function openUserDataHolder(holder: UserDataHolder, pin: string):
    Promise<{ data: UserData, pinKey: PinKey | null }> {
    if (isSealed(holder.encryptedData)) {
        const {data, pinKey} = await open<UserData>(holder.encryptedData, pin);
        return {data, pinKey};
    }
    try {
        return {data: cypherService.decrypt<UserData>(holder.encryptedData, pin), pinKey: null};
    } catch {
        throw new WrongPinError();
    }
}

/** A backup that passed validation, ready to replace the stored wallet. */
export interface ImportedWallet {
    holder: UserDataHolder;
    data: UserData;
    /** set when the backup was opened with a PIN in the current format */
    pinKey: PinKey | null;
}

interface Session {
    pinKey: PinKey;
    data: UserData;
}

export default function UserDataService({storageFactory}: { storageFactory: UserDataStorageFactory }) {

    const [userDataHolder, setUserDataHolder]
        = storageFactory.createStorage(
        "userDataHolder", () => initUserDataHolder(new UserData(), true)
    );
    // While a PIN-locked wallet is unlocked: its key and decrypted data, in memory only.
    const [session, setSession] = useState<Session | null>(null);

    // Saves are queued so they land in order; replacing the wallet (new, imported, demo) bumps the
    // generation so a save still in flight for the previous wallet is dropped.
    const writes = useRef<Promise<unknown>>(Promise.resolve());
    const generation = useRef(0);
    const enqueue = useCallback((write: (stillCurrent: () => boolean) => Promise<void>) => {
        const gen = generation.current;
        const stillCurrent = () => gen === generation.current;
        writes.current = writes.current
            .then(() => stillCurrent() ? write(stillCurrent) : undefined)
            .catch((e) => console.warn("could not save the wallet", e));
        return writes.current as Promise<void>;
    }, []);

    const userData: UserData = useMemo(() => {
        if (userDataHolder.pinCodeEncrypted) {
            return session?.data ?? new UserData(unauthorizedId);
        }
        try {
            // Stored data may predate today's rules: canonicalise amounts, never drop entries.
            return sanitizeUserData(cypherService.decrypt<UserData>(userDataHolder.encryptedData, DEFAULT_PIN_CODE))
        } catch (e: unknown) {
            return new UserData(unauthorizedId)
        }
    }, [userDataHolder, session])

    const loggedIn = !!userData.id && userData.id !== unauthorizedId;
    const isDemoMode = userDataHolder.demo;
    const shouldEnterPinCode = !isDemoMode && userDataHolder.pinCodeEncrypted && !session;

    /** Unlock with `pin`; false on a wrong PIN. Throws when this browser couldn't check it (the
     *  stored wallet is left untouched). Data from older versions is re-saved on the way. */
    const unlock = async (pin: string): Promise<boolean> => {
        const holder = userDataHolder;
        const gen = generation.current;
        let opened;
        try {
            opened = await openUserDataHolder(holder, pin);
        } catch (e) {
            if (e instanceof WrongPinError) return false;
            throw e;
        }
        const data = sanitizeUserData(withoutStoredPin(opened.data));
        if (!data?.id) return false;
        let pinKey = opened.pinKey;
        if (!pinKey) {
            pinKey = await newPinKey(pin);
            const upgraded = await sealUserDataHolder(data, pinKey);
            if (gen !== generation.current) return false;
            setUserDataHolder(upgraded);
        }
        setSession({pinKey, data});
        return true;
    };

    /** Check `pin` against the stored wallet without changing anything. Throws like `unlock`. */
    const verifyPin = async (pin: string): Promise<boolean> => {
        try {
            await openUserDataHolder(userDataHolder, pin);
            return true;
        } catch (e) {
            if (e instanceof WrongPinError) return false;
            throw e;
        }
    };

    const lock = () => setSession(null);

    const setUserData = ((next: UserData) => {
        const loggedInNew = !!next.id && next.id !== unauthorizedId;
        if (!loggedIn || !loggedInNew) {
            return
        }
        if (userDataHolder.pinCodeEncrypted) {
            if (!session) return;
            const {pinKey} = session;
            setSession({pinKey, data: next});
            void enqueue(async (stillCurrent) => {
                const holder = await sealUserDataHolder(next, pinKey);
                if (stillCurrent()) setUserDataHolder(holder);
            });
        } else {
            setUserDataHolder(initUserDataHolder(next, userDataHolder.demo));
        }
    }) as Dispatch<SetStateAction<UserData>>

    /** Lock the wallet with a new PIN (setting the first one, or changing it). */
    const setUserDataPin = async (pin: string): Promise<void> => {
        if (!loggedIn) return;
        const data = userData;
        const pinKey = await newPinKey(pin);
        await enqueue(async (stillCurrent) => {
            const holder = await sealUserDataHolder(data, pinKey);
            if (!stillCurrent()) return;
            setUserDataHolder(holder);
            setSession({pinKey, data});
        });
    };

    /** Replace whatever is stored with a new wallet locked with `pin`. */
    const createWallet = async (data: UserData, pin: string): Promise<void> => {
        const pinKey = await newPinKey(pin);
        const holder = await sealUserDataHolder(data, pinKey);
        generation.current++;
        setUserDataHolder(holder);
        setSession({pinKey, data});
    };

    /** Replace whatever is stored with a validated backup. A backup in an older PIN format is
     *  re-saved in the current one with the PIN it was opened with. */
    const importWallet = async (imported: ImportedWallet, pin?: string): Promise<void> => {
        const data = sanitizeUserData(withoutStoredPin(imported.data));
        if (!imported.holder.pinCodeEncrypted) {
            generation.current++;
            setUserDataHolder(new UserDataHolder(false, imported.holder.encryptedData, false));
            setSession(null);
            return;
        }
        let {pinKey, holder} = imported;
        if (!pinKey) {
            if (!pin) throw new Error('PIN required');
            pinKey = await newPinKey(pin);
            holder = await sealUserDataHolder(data, pinKey);
        }
        generation.current++;
        setUserDataHolder(holder);
        setSession({pinKey, data});
    };

    /** Switch to a demo wallet (kept in memory only). */
    const startDemo = (holder: UserDataHolder) => {
        generation.current++;
        setUserDataHolder(holder);
        setSession(null);
    };

    return {
        userData, setUserData, setUserDataPin,
        userDataHolder,
        shouldEnterPinCode,
        isDemoMode,
        loggedIn,
        unlock, verifyPin, lock,
        createWallet, importWallet, startDemo,
    }
};
