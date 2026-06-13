import readStoredValue from './readStoredValue';
import InMemoryStorage from './InMemoryStorage';

describe('readStoredValue', () => {
    test('returns the parsed value when stored JSON is valid', () => {
        const storage = new InMemoryStorage();
        storage.setItem('k', JSON.stringify({ a: 1 }));

        expect(readStoredValue(storage, 'k', () => ({ a: 0 }))).toEqual({ a: 1 });
    });

    test('preserves falsy stored values (false / 0 / "")', () => {
        const storage = new InMemoryStorage();
        storage.setItem('flag', JSON.stringify(false));
        storage.setItem('count', JSON.stringify(0));

        expect(readStoredValue(storage, 'flag', () => true)).toBe(false);
        expect(readStoredValue(storage, 'count', () => 9)).toBe(0);
    });

    test('uses the initializer when nothing is stored', () => {
        const storage = new InMemoryStorage();

        expect(readStoredValue(storage, 'missing', () => 'default')).toBe('default');
    });

    test('falls back to the initializer and drops the key when the value is corrupt', () => {
        const storage = new InMemoryStorage();
        storage.setItem('k', 'not-json');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = readStoredValue(storage, 'k', () => ({ a: 42 }));

        expect(result).toEqual({ a: 42 });
        // corrupt value is removed so it self-heals on the next load
        expect(storage.getItem('k')).toBeNull();
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});
