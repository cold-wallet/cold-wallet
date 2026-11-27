import UserData from "../domain/UserData";
import UserDataHolder from "../domain/UserDataHolder";
import {Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState} from "react";
import cypherService from "./CypherService";
import UserDataStorageFactory from "../domain/UserDataStorageFactory";
import {normalizeAmount} from "../utils/amount";
import {
    isNewerFormat, isSealed, isWeakerThanCurrent, NewerFormatError, newPinKey, open, openWithKey, seal, WrongPinError,
    type PinKey,
} from "./PinVault";

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
 * the current format. Throws WrongPinError on a wrong PIN or damaged data, NewerFormatError for data
 * saved by a newer version of the app; any other error means this browser couldn't do the work.
 */
export async function openUserDataHolder(holder: UserDataHolder, pin: string):
    Promise<{ data: UserData, pinKey: PinKey | null }> {
    if (isNewerFormat(holder.encryptedData)) throw new NewerFormatError();
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
    /** null: a wallet in the older format that this browser couldn't move to a PIN key (see unlock) */
    pinKey: PinKey | null;
    /** the PIN of such a wallet, needed to keep saving it in its own format; unset otherwise */
    legacyPin?: string;
    data: UserData;
}

/** Seal `data` the way the open wallet is stored. */
async function sealForSession(data: UserData, session: Session): Promise<UserDataHolder> {
    if (session.pinKey) return sealUserDataHolder(data, session.pinKey);
    return new UserDataHolder(true, cypherService.encrypt(withoutStoredPin(data), session.legacyPin!), false);
}

/** Open stored data with what the open session holds (its key, or the PIN of an older-format wallet). */
async function openForSession(encrypted: string, session: Session): Promise<UserData> {
    if (session.pinKey) return openWithKey<UserData>(encrypted, session.pinKey);
    if (isSealed(encrypted)) throw new WrongPinError();
    try {
        return cypherService.decrypt<UserData>(encrypted, session.legacyPin!);
    } catch {
        throw new WrongPinError();
    }
}

/** Why the wallet was locked while open: no activity, the user locked it, it changed in another tab,
 *  or an older copy of the app in another tab saved it. */
export type LockReason = 'idle' | 'manual' | 'elsewhere' | 'outdated';

export default function UserDataService({storageFactory}: { storageFactory: UserDataStorageFactory }) {

    const [userDataHolder, setStoredHolder]
        = storageFactory.createStorage(
        "userDataHolder", () => initUserDataHolder(new UserData(), true)
    );
    // The holder this tab last wrote or adopted. A different one in storage was written by another tab.
    const ownHolder = useRef(userDataHolder);
    const writeHolder = useCallback((holder: UserDataHolder) => {
        ownHolder.current = holder;
        setStoredHolder(holder);
    }, [setStoredHolder]);

    // While a PIN-locked wallet is unlocked: its key and decrypted data, in memory only. The ref is
    // the latest value, also for callbacks created in an earlier render (e.g. a save that completes
    // after a network request): once locked, nothing but the PIN opens the wallet again.
    const [session, setSessionState] = useState<Session | null>(null);
    const sessionRef = useRef<Session | null>(null);
    const [lockReason, setLockReason] = useState<LockReason | null>(null);
    // Bumped on every lock; work that started before it may not reopen the wallet.
    const epoch = useRef(0);
    const openSession = useCallback((next: Session) => {
        sessionRef.current = next;
        setSessionState(next);
        setLockReason(null);
    }, []);
    const closeSession = useCallback((reason: LockReason | null) => {
        epoch.current++;
        sessionRef.current = null;
        setSessionState(null);
        setLockReason(reason);
    }, []);

    // Saves are queued so they land in order; replacing the wallet (new, imported, demo, or changed
    // in another tab) bumps the generation so a save still in flight for the previous one is dropped.
    // The returned promise says whether the write landed (false: dropped) and rejects if it failed.
    const writes = useRef<Promise<unknown>>(Promise.resolve());
    const generation = useRef(0);
    const enqueue = useCallback((write: (stillCurrent: () => boolean) => Promise<boolean>) => {
        const gen = generation.current;
        const stillCurrent = () => gen === generation.current;
        const run = writes.current.then(() => stillCurrent() ? write(stillCurrent) : false);
        writes.current = run.catch((e) => console.warn("could not save the wallet", e));
        return run;
    }, []);

    // The wallet was saved in another tab: take its data if it still opens with this tab's key,
    // otherwise (its PIN was changed there, or it was replaced) lock this tab. Data in the older
    // format, while this tab uses a PIN key, comes from an older copy of the app left open.
    useEffect(() => {
        if (userDataHolder === ownHolder.current) return;
        ownHolder.current = userDataHolder;
        generation.current++;
        const current = sessionRef.current;
        if (!current) return;
        const since = epoch.current;
        const adopt = async () => {
            if (!userDataHolder.pinCodeEncrypted) throw new WrongPinError();
            const data = sanitizeUserData(withoutStoredPin(await openForSession(userDataHolder.encryptedData, current)));
            if (!data?.id) throw new WrongPinError();
            return data;
        };
        const fromOlderApp = !!current.pinKey && userDataHolder.pinCodeEncrypted
            && !isSealed(userDataHolder.encryptedData) && !isNewerFormat(userDataHolder.encryptedData);
        adopt().then(
            (data) => {
                if (epoch.current === since && ownHolder.current === userDataHolder) openSession({...current, data});
            },
            () => {
                if (epoch.current === since) closeSession(fromOlderApp ? 'outdated' : 'elsewhere');
            },
        );
    }, [userDataHolder, openSession, closeSession]);

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

    /** Unlock with `pin`; false on a wrong PIN. Throws when this browser couldn't check it, or
     *  NewerFormatError (the stored wallet is left untouched). Data from older versions, or locked
     *  with weaker key parameters than today's, is re-saved on the way when this browser can derive
     *  a new key; otherwise it opens as it is and the next unlock tries again. */
    const unlock = async (pin: string): Promise<boolean> => {
        const holder = ownHolder.current;
        let opened;
        try {
            opened = await openUserDataHolder(holder, pin);
        } catch (e) {
            if (e instanceof WrongPinError) return false;
            throw e;
        }
        // replaced meanwhile (another tab): check the PIN against what is stored now
        if (ownHolder.current !== holder) return unlock(pin);
        const data = sanitizeUserData(withoutStoredPin(opened.data));
        if (!data?.id) return false;
        let pinKey = opened.pinKey;
        if (!pinKey || isWeakerThanCurrent(pinKey.kdf)) {
            let upgraded: { holder: UserDataHolder, pinKey: PinKey } | null = null;
            try {
                const fresh = await newPinKey(pin);
                upgraded = {holder: await sealUserDataHolder(data, fresh), pinKey: fresh};
            } catch {
                // e.g. not enough memory for the new key: keep the current key, or for data in the
                // older format keep that format (saved with the PIN); the next unlock tries again
            }
            if (ownHolder.current !== holder) return unlock(pin);
            if (upgraded) {
                writeHolder(upgraded.holder);
                pinKey = upgraded.pinKey;
            }
        }
        openSession(pinKey ? {pinKey, data} : {pinKey: null, legacyPin: pin, data});
        return true;
    };

    /** Check `pin` against the stored wallet without changing anything. Throws like `unlock`. */
    const verifyPin = async (pin: string): Promise<boolean> => {
        try {
            await openUserDataHolder(ownHolder.current, pin);
            return true;
        } catch (e) {
            if (e instanceof WrongPinError) return false;
            throw e;
        }
    };

    const lock = (reason: LockReason = 'manual') => closeSession(reason);

    const setUserData = ((next: UserData) => {
        const loggedInNew = !!next.id && next.id !== unauthorizedId;
        if (!loggedInNew) return;
        const holder = ownHolder.current;
        if (holder.pinCodeEncrypted) {
            const current = sessionRef.current;
            if (!current) return; // locked, even if this callback was made while it was open
            const {pinKey} = current;
            openSession({...current, data: next});
            enqueue(async (stillCurrent) => {
                const sealed = await sealForSession(next, current);
                if (!stillCurrent()) return false;
                writeHolder(sealed);
                return true;
            }).catch(() => { /* logged by the queue */ });
        } else if (loggedIn) {
            writeHolder(initUserDataHolder(next, holder.demo));
        }
    }) as Dispatch<SetStateAction<UserData>>

    /** Lock the wallet with a new PIN (setting the first one, or changing it). Rejects when the PIN
     *  could not be saved: it locked meanwhile, another tab replaced the wallet, or saving failed. */
    const setUserDataPin = async (pin: string): Promise<void> => {
        if (!loggedIn) return;
        const since = epoch.current;
        const dataNow = userData;
        const pinKey = await newPinKey(pin);
        const saved = await enqueue(async (stillCurrent) => {
            if (epoch.current !== since) return false; // locked meanwhile: it stays locked, PIN unchanged
            // the latest data, including changes saved while the key was being derived
            const data = sessionRef.current?.data ?? dataNow;
            const holder = await sealUserDataHolder(data, pinKey);
            if (!stillCurrent() || epoch.current !== since) return false;
            writeHolder(holder);
            openSession({pinKey, data});
            return true;
        });
        if (!saved) throw new Error('the new PIN was not saved');
    };

    /** Replace whatever is stored with a new wallet locked with `pin`. */
    const createWallet = async (data: UserData, pin: string): Promise<void> => {
        const pinKey = await newPinKey(pin);
        const holder = await sealUserDataHolder(data, pinKey);
        generation.current++;
        writeHolder(holder);
        openSession({pinKey, data});
    };

    /** Replace whatever is stored with a validated backup. A backup in an older PIN format, or
     *  locked with weaker key parameters, is re-saved with the PIN it was opened with. */
    const importWallet = async (imported: ImportedWallet, pin?: string): Promise<void> => {
        const since = epoch.current;
        const data = sanitizeUserData(withoutStoredPin(imported.data));
        if (!imported.holder.pinCodeEncrypted) {
            generation.current++;
            writeHolder(new UserDataHolder(false, imported.holder.encryptedData, false));
            closeSession(null);
            return;
        }
        let {pinKey, holder} = imported;
        if (!pinKey || isWeakerThanCurrent(pinKey.kdf)) {
            if (!pin) {
                if (!pinKey) throw new Error('PIN required');
            } else {
                try {
                    const fresh = await newPinKey(pin);
                    holder = await sealUserDataHolder(data, fresh);
                    pinKey = fresh;
                } catch {
                    // as in unlock: an older-format backup is kept in its format, saved with its PIN
                }
            }
        }
        generation.current++;
        writeHolder(holder);
        // locked while this ran: the restored wallet stays locked too
        if (epoch.current === since) openSession(pinKey ? {pinKey, data} : {pinKey: null, legacyPin: pin, data});
    };

    /** Switch to a demo wallet (kept in memory only). */
    const startDemo = (holder: UserDataHolder) => {
        generation.current++;
        writeHolder(holder);
        closeSession(null);
    };

    return {
        userData, setUserData, setUserDataPin,
        userDataHolder,
        shouldEnterPinCode,
        isDemoMode,
        loggedIn,
        lockReason,
        unlock, verifyPin, lock,
        createWallet, importWallet, startDemo,
    }
};
