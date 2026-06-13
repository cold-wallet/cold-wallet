// Reads and JSON-parses a persisted value, guarding the parse so a corrupt / non-JSON entry
// can never crash the app on read. On failure it drops the bad key (so it self-heals on the
// next load) and falls back to the initializer's default. Shared by the storage repository
// factories — the write side already guards against QuotaExceededError; this guards the read.
export default function readStoredValue<T>(storage: Storage, key: string, initializer: () => T): T {
    const storedData = storage.getItem(key);
    if (storedData == null) {
        return initializer();
    }
    try {
        return JSON.parse(storedData) as T;
    } catch (e) {
        console.warn(`storage: discarding corrupt value for "${key}"`, e);
        try {
            storage.removeItem(key);
        } catch { /* ignore */ }
        return initializer();
    }
}
