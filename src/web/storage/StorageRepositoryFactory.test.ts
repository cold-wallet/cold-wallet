import { act, renderHook } from '@testing-library/react';
import StorageRepositoryFactory from './StorageRepositoryFactory';
import InMemoryStorage from './InMemoryStorage';

describe('StorageRepositoryFactory', () => {
  it('a value cleared on purpose leaves storage, so it does not come back on reload', () => {
    const storage = new InMemoryStorage();
    storage.setItem('binanceUserData', JSON.stringify({ funding: [] }));
    const [, nullable] = StorageRepositoryFactory(storage);
    const { result } = renderHook(() => nullable<{ funding: unknown[] }>('binanceUserData'));
    expect(result.current[0]).toEqual({ funding: [] });

    act(() => result.current[1](null));
    expect(storage.getItem('binanceUserData')).toBeNull();
  });

  it('still saves falsy values', () => {
    const storage = new InMemoryStorage();
    const [repo] = StorageRepositoryFactory(storage);
    const { result } = renderHook(() => repo<boolean>('hideAmounts', () => true));
    act(() => result.current[1](false));
    expect(storage.getItem('hideAmounts')).toBe('false');
  });
});
