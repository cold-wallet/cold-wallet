import { renderHook, act } from '@testing-library/react';
import UserDataStorageRepositoryFactory from './UserDataStorageRepositoryFactory';
import UserDataHolder from '../../core/domain/UserDataHolder';
import InMemoryStorage from './InMemoryStorage';

const holder = (data: string) => new UserDataHolder(true, data, false);

// What the browser fires in the other tabs when one of them writes to a storage.
function storageEvent(storageArea: Storage, key: string | null) {
  const e = new Event('storage');
  Object.assign(e, { key, storageArea });
  act(() => { window.dispatchEvent(e); });
}

describe('UserDataStorageRepository', () => {
  it('picks up the wallet saved in another tab', () => {
    const storage = new InMemoryStorage();
    const [useRepo] = UserDataStorageRepositoryFactory(storage);
    const { result } = renderHook(() => useRepo('userDataHolder', () => holder('first')));
    expect(result.current[0].encryptedData).toBe('first');

    storage.setItem('userDataHolder', JSON.stringify(holder('from another tab')));
    storageEvent(storage, 'userDataHolder');
    expect(result.current[0].encryptedData).toBe('from another tab');
  });

  it('ignores other keys and other storages', () => {
    const storage = new InMemoryStorage();
    const other = new InMemoryStorage();
    const [useRepo] = UserDataStorageRepositoryFactory(storage);
    const { result } = renderHook(() => useRepo('userDataHolder', () => holder('first')));
    storage.setItem('userDataHolder', JSON.stringify(holder('changed')));
    storageEvent(other, 'userDataHolder');
    storageEvent(storage, 'hideAmounts');
    expect(result.current[0].encryptedData).toBe('first');
  });
});
