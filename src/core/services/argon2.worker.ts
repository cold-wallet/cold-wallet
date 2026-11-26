// Derives the PIN key off the main thread, so the page (and the "Unlocking…" status) stays
// responsive while Argon2id works through its memory.
import { argon2id } from 'hash-wasm';

interface Job { id: number; pin: string; salt: Uint8Array; m: number; t: number; p: number }

self.onmessage = async (e: MessageEvent<Job>) => {
    const { id, pin, salt, m, t, p } = e.data;
    try {
        const raw = await argon2id({ password: pin, salt, parallelism: p, iterations: t, memorySize: m, hashLength: 32, outputType: 'binary' });
        (self as unknown as Worker).postMessage({ id, raw }, [raw.buffer]);
    } catch (err) {
        (self as unknown as Worker).postMessage({ id, error: String(err) });
    }
};
