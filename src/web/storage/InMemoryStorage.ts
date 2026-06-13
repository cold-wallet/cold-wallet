// A Map-backed implementation of the DOM `Storage` interface. Used to give demo sessions a
// throwaway store: it satisfies the same shape as localStorage/sessionStorage, but nothing
// ever leaves the page — values live only for the lifetime of the tab/mount and are never
// read from or written to real browser storage.
export default class InMemoryStorage implements Storage {
    private readonly map = new Map<string, string>();

    get length(): number {
        return this.map.size;
    }

    clear(): void {
        this.map.clear();
    }

    getItem(key: string): string | null {
        return this.map.has(key) ? this.map.get(key)! : null;
    }

    key(index: number): string | null {
        return Array.from(this.map.keys())[index] ?? null;
    }

    removeItem(key: string): void {
        this.map.delete(key);
    }

    setItem(key: string, value: string): void {
        this.map.set(key, String(value));
    }

    [name: string]: any;
}
