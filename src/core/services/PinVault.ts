// services/PinVault.ts — encrypts wallet data with a key derived from the user's PIN.
//
// Key: Argon2id(PIN, random per-wallet salt) → a non-extractable AES-256-GCM WebCrypto key.
// Each save uses a fresh random IV; GCM authenticates the data, so a wrong PIN or a damaged token
// is always detected. The KDF parameters travel with the data, so they can be raised later
// without another migration. The derived key stays in memory while the wallet is unlocked; the
// PIN itself is not kept anywhere.
//
// Sealed format: "cw2." + base64(JSON { kdf, salt, iv, ct }).
import { argon2id } from 'hash-wasm';
// a module worker in dev, a classic one in the build (older WebViews lack module workers)
import Argon2Worker from './argon2.worker.ts?worker';

export interface KdfParams {
    alg: 'argon2id';
    /** memory, KiB */
    m: number;
    /** passes */
    t: number;
    /** lanes */
    p: number;
}

export const DEFAULT_KDF: KdfParams = { alg: 'argon2id', m: 64 * 1024, t: 3, p: 1 };
let kdfForNewKeys: KdfParams = DEFAULT_KDF;

/** Tests only: cheaper parameters for keys created from now on. */
export function setKdfParamsForTests(params: KdfParams) {
    kdfForNewKeys = params;
}

/** A PIN-derived key plus what is needed to store data sealed with it. */
export interface PinKey {
    key: CryptoKey;
    kdf: KdfParams;
    /** base64 */
    salt: string;
}

interface Envelope {
    kdf: KdfParams;
    salt: string;
    iv: string;
    ct: string;
}

const PREFIX = 'cw2.';

/** The data can't be opened with this PIN: a wrong PIN, or altered / malformed data. Any other
 *  error from `open` means this browser couldn't derive the key (e.g. not enough memory). */
export class WrongPinError extends Error {
    constructor() {
        super('wrong PIN or damaged data');
        this.name = 'WrongPinError';
    }
}

export const isSealed = (encrypted: string) => typeof encrypted === 'string' && encrypted.startsWith(PREFIX);

function toB64(bytes: Uint8Array): string {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
}

function fromB64(b64: string): Uint8Array<ArrayBuffer> {
    const s = atob(b64);
    const out = new Uint8Array(new ArrayBuffer(s.length));
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
}

// Bounds for parameters read from stored data or a pasted token, so a crafted token can't make
// the browser allocate gigabytes or spin for minutes.
function checkKdf(kdf: unknown): KdfParams {
    const k = kdf as KdfParams;
    const ok = !!k && k.alg === 'argon2id'
        && Number.isInteger(k.m) && k.m >= 8 && k.m <= 256 * 1024
        && Number.isInteger(k.t) && k.t >= 1 && k.t <= 10
        && Number.isInteger(k.p) && k.p >= 1 && k.p <= 4
        && k.m >= 8 * k.p;
    if (!ok) throw new Error('unsupported key parameters');
    return { alg: 'argon2id', m: k.m, t: k.t, p: k.p };
}

// Argon2id runs in a Web Worker when the browser has them (the page stays responsive); otherwise,
// or if the worker fails to start, on the main thread after letting the browser paint.
let worker: Worker | null | undefined;
let nextJob = 0;
const jobs = new Map<number, { resolve: (raw: Uint8Array) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
    if (worker !== undefined) return worker;
    try {
        worker = typeof Worker === 'undefined' ? null : new Argon2Worker();
        if (worker) {
            worker.onmessage = (e: MessageEvent<{ id: number; raw?: Uint8Array; error?: string }>) => {
                const job = jobs.get(e.data.id);
                jobs.delete(e.data.id);
                if (!job) return;
                if (e.data.raw) job.resolve(e.data.raw);
                else job.reject(new Error(e.data.error || 'key derivation failed'));
            };
            worker.onerror = () => {
                // the worker can't run here: fail pending jobs over to the main thread
                worker?.terminate();
                worker = null;
                const pending = [...jobs.values()];
                jobs.clear();
                pending.forEach((j) => j.reject(new Error('worker unavailable')));
            };
        }
    } catch {
        worker = null;
    }
    return worker;
}

async function argon2OnMainThread(pin: string, salt: Uint8Array, kdf: KdfParams): Promise<Uint8Array> {
    await new Promise((r) => setTimeout(r, 30)); // let "Unlocking…" paint before the page is busy
    return argon2id({
        password: pin, salt,
        parallelism: kdf.p, iterations: kdf.t, memorySize: kdf.m,
        hashLength: 32, outputType: 'binary',
    });
}

async function argon2(pin: string, salt: Uint8Array, kdf: KdfParams): Promise<Uint8Array> {
    const w = getWorker();
    if (w) {
        try {
            return await new Promise<Uint8Array>((resolve, reject) => {
                const id = ++nextJob;
                jobs.set(id, { resolve, reject });
                w.postMessage({ id, pin, salt, m: kdf.m, t: kdf.t, p: kdf.p });
            });
        } catch (e) {
            if (worker) throw e; // the worker ran and Argon2id itself failed (e.g. out of memory)
        }
    }
    return argon2OnMainThread(pin, salt, kdf);
}

async function deriveKey(pin: string, salt: Uint8Array, kdf: KdfParams): Promise<CryptoKey> {
    const raw = await argon2(pin, salt, kdf);
    try {
        return await crypto.subtle.importKey('raw', raw as Uint8Array<ArrayBuffer>, 'AES-GCM', false, ['encrypt', 'decrypt']);
    } finally {
        raw.fill(0);
    }
}

/** A new key for `pin` with a fresh random salt (new wallet, or a PIN being set or changed). */
export async function newPinKey(pin: string): Promise<PinKey> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const kdf = kdfForNewKeys;
    return { key: await deriveKey(pin, salt, kdf), kdf, salt: toB64(salt) };
}

export async function seal(data: unknown, pinKey: PinKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plain = new TextEncoder().encode(JSON.stringify(data));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, pinKey.key, plain));
    const envelope: Envelope = { kdf: pinKey.kdf, salt: pinKey.salt, iv: toB64(iv), ct: toB64(ct) };
    return PREFIX + toB64(new TextEncoder().encode(JSON.stringify(envelope)));
}

/**
 * Open sealed data with `pin`. Throws on a wrong PIN or damaged data. Also returns the key, so
 * later saves don't need the PIN again.
 */
export async function open<T>(sealed: string, pin: string): Promise<{ data: T; pinKey: PinKey }> {
    let envelope: Envelope, kdf: KdfParams, salt: Uint8Array;
    try {
        if (!isSealed(sealed)) throw new Error('not sealed data');
        envelope = JSON.parse(new TextDecoder().decode(fromB64(sealed.slice(PREFIX.length)))) as Envelope;
        kdf = checkKdf(envelope.kdf);
        salt = fromB64(envelope.salt);
        if (salt.length < 8) throw new Error('bad salt');
    } catch {
        throw new WrongPinError();
    }
    const key = await deriveKey(pin, salt, kdf);
    let data: T;
    try {
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(envelope.iv) }, key, fromB64(envelope.ct));
        data = JSON.parse(new TextDecoder().decode(plain)) as T;
    } catch {
        throw new WrongPinError();
    }
    return { data, pinKey: { key, kdf, salt: envelope.salt } };
}
