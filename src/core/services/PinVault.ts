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
// "cw<version>." — anything above 2 was written by a newer version of the app.
const VERSIONED = /^cw(\d+)\./;

/** The data can't be opened with this PIN: a wrong PIN, or altered / malformed data. Any other
 *  error from `open` means this browser couldn't derive the key (e.g. not enough memory). */
export class WrongPinError extends Error {
    constructor() {
        super('wrong PIN or damaged data');
        this.name = 'WrongPinError';
    }
}

/** Data written by a newer version of the app, in a format this version can't read. */
export class NewerFormatError extends Error {
    constructor() {
        super('saved by a newer version');
        this.name = 'NewerFormatError';
    }
}

/** The key could not be derived in time (the worker stopped answering). */
export class KeyDerivationTimeoutError extends Error {
    constructor() {
        super('key derivation timed out');
        this.name = 'KeyDerivationTimeoutError';
    }
}

export const isSealed = (encrypted: string) => typeof encrypted === 'string' && encrypted.startsWith(PREFIX);

export function isNewerFormat(encrypted: string): boolean {
    const m = typeof encrypted === 'string' ? VERSIONED.exec(encrypted) : null;
    return !!m && Number(m[1]) > 2;
}

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
// the browser allocate gigabytes or spin for minutes. Well-formed parameters beyond them (stronger
// ones a newer version may use) are reported as a newer format, not as a wrong PIN.
function checkKdf(kdf: unknown): KdfParams {
    const k = kdf as KdfParams;
    const wellFormed = !!k && k.alg === 'argon2id'
        && Number.isInteger(k.m) && Number.isInteger(k.t) && Number.isInteger(k.p)
        && k.m >= 8 * k.p && k.t >= 1 && k.p >= 1;
    if (!wellFormed) throw new WrongPinError();
    if (k.m > 256 * 1024 || k.t > 10 || k.p > 4) throw new NewerFormatError();
    return { alg: 'argon2id', m: k.m, t: k.t, p: k.p };
}

// Argon2id runs in a Web Worker when the browser has them (the page stays responsive); otherwise,
// or if the worker fails to start, on the main thread after letting the browser paint.
/** A worker that answers nothing for this long is stopped, and the attempt fails (it can be retried). */
export const WORKER_TIMEOUT_MS = 60_000;

class WorkerUnavailableError extends Error {}
/** The worker was restarted because another job hung: this job starts again on the new one. */
class WorkerRestartedError extends Error {}

const defaultWorker = () => (typeof Worker === 'undefined' ? null : new Argon2Worker());
let createWorker: () => Worker | null = defaultWorker;
let worker: Worker | null | undefined;
let nextJob = 0;
const jobs = new Map<number, { resolve: (raw: Uint8Array) => void; reject: (e: Error) => void }>();

/** Tests only: how the worker is created (undefined: the real one). Resets the current worker. */
export function setWorkerFactoryForTests(factory: (() => Worker | null) | undefined) {
    stopWorker(undefined);
    createWorker = factory ?? defaultWorker;
}

/** Stop the worker and fail its pending jobs. `next`: null = don't try workers again, undefined = start a new one next time. */
function stopWorker(next: null | undefined, error: Error = new WorkerUnavailableError()) {
    worker?.terminate();
    worker = next;
    const pending = [...jobs.values()];
    jobs.clear();
    pending.forEach((j) => j.reject(error));
}

function getWorker(): Worker | null {
    if (worker !== undefined) return worker;
    try {
        worker = createWorker();
        if (worker) {
            worker.onmessage = (e: MessageEvent<{ id: number; raw?: Uint8Array; error?: string }>) => {
                const job = jobs.get(e.data.id);
                jobs.delete(e.data.id);
                if (!job) return;
                if (e.data.raw) job.resolve(e.data.raw);
                else job.reject(new Error(e.data.error || 'key derivation failed'));
            };
            // the worker can't run here: pending jobs fail over to the main thread
            worker.onerror = () => stopWorker(null);
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
                const timer = setTimeout(() => {
                    const job = jobs.get(id);
                    if (!job) return;
                    jobs.delete(id);
                    job.reject(new KeyDerivationTimeoutError());
                    // the worker is stuck: replace it; other jobs it held start over on the new one
                    stopWorker(undefined, new WorkerRestartedError());
                }, WORKER_TIMEOUT_MS);
                jobs.set(id, {
                    resolve: (raw) => { clearTimeout(timer); resolve(raw); },
                    reject: (e) => { clearTimeout(timer); reject(e); },
                });
                w.postMessage({ id, pin, salt, m: kdf.m, t: kdf.t, p: kdf.p });
            });
        } catch (e) {
            if (e instanceof WorkerRestartedError) return argon2(pin, salt, kdf);
            // the worker ran and Argon2id itself failed (e.g. out of memory), or it stopped answering
            if (!(e instanceof WorkerUnavailableError)) throw e;
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

/** Keys made with weaker parameters than new keys get now: re-save with a new key when the PIN is at
 *  hand. Memory is what makes Argon2id costly to attack, so more memory with fewer passes is kept. */
export function isWeakerThanCurrent(kdf: KdfParams): boolean {
    return kdf.m < kdfForNewKeys.m || (kdf.m === kdfForNewKeys.m && kdf.t < kdfForNewKeys.t);
}

function readEnvelope(sealed: string): { envelope: Envelope; kdf: KdfParams; salt: Uint8Array } {
    try {
        if (!isSealed(sealed)) throw new Error('not sealed data');
        const envelope = JSON.parse(new TextDecoder().decode(fromB64(sealed.slice(PREFIX.length)))) as Envelope;
        const kdf = checkKdf(envelope.kdf);
        const salt = fromB64(envelope.salt);
        if (salt.length < 8) throw new Error('bad salt');
        return { envelope, kdf, salt };
    } catch (e) {
        if (e instanceof NewerFormatError) throw e;
        throw new WrongPinError();
    }
}

async function decrypt<T>(envelope: Envelope, key: CryptoKey): Promise<T> {
    try {
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(envelope.iv) }, key, fromB64(envelope.ct));
        return JSON.parse(new TextDecoder().decode(plain)) as T;
    } catch {
        throw new WrongPinError();
    }
}

/**
 * Open sealed data with `pin`. Throws on a wrong PIN or damaged data. Also returns the key, so
 * later saves don't need the PIN again.
 */
export async function open<T>(sealed: string, pin: string): Promise<{ data: T; pinKey: PinKey }> {
    const { envelope, kdf, salt } = readEnvelope(sealed);
    const key = await deriveKey(pin, salt, kdf);
    const data = await decrypt<T>(envelope, key);
    return { data, pinKey: { key, kdf, salt: envelope.salt } };
}

/**
 * Open sealed data with a key already in memory (no PIN, no key derivation). Throws WrongPinError
 * when the data was sealed with another key, e.g. after the PIN was changed elsewhere.
 */
export async function openWithKey<T>(sealed: string, pinKey: PinKey): Promise<T> {
    const { envelope, kdf } = readEnvelope(sealed);
    const sameKey = envelope.salt === pinKey.salt
        && kdf.m === pinKey.kdf.m && kdf.t === pinKey.kdf.t && kdf.p === pinKey.kdf.p;
    if (!sameKey) throw new WrongPinError();
    return decrypt<T>(envelope, pinKey.key);
}
