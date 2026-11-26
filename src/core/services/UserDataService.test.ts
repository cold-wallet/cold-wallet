import { useState } from 'react';
import { renderHook, act } from '@testing-library/react';
import UserDataService, { DEFAULT_PIN_CODE, initUserDataHolder } from './UserDataService';
import cypherService from './CypherService';
import UserData, { UserSettings } from '../domain/UserData';
import UserDataHolder from '../domain/UserDataHolder';
import type UserDataStorageFactory from '../domain/UserDataStorageFactory';

// In-memory storage seeded with `initial`; `stored()` reads what the service last saved.
function memoryStorage(initial: UserDataHolder) {
  let last = initial;
  function useHolder() {
    const [value, setValue] = useState(initial);
    last = value;
    return [value, setValue] as ReturnType<UserDataStorageFactory['createStorage']>;
  }
  const factory: UserDataStorageFactory = { createStorage: useHolder };
  return { factory, stored: () => last };
}

function run(holder: UserDataHolder, pin: string | null) {
  const storage = memoryStorage(holder);
  const hook = renderHook(({ p }) => UserDataService({ storageFactory: storage.factory, pinCode: p }), { initialProps: { p: pin } });
  return { ...storage, hook };
}

const wallet = () => new UserData('u1', new UserSettings(), [], Date.now());

describe('UserDataService: the PIN is the key, never part of the data', () => {
  it('unlocks with the right PIN and stays locked with a wrong or missing one', () => {
    const holder = initUserDataHolder(wallet(), false, '2580');
    expect(run(holder, '2580').hook.result.current.loggedIn).toBe(true);
    expect(run(holder, '2580').hook.result.current.shouldEnterPinCode).toBe(false);
    for (const pin of ['1111', null]) {
      const { result } = run(holder, pin).hook;
      expect(result.current.loggedIn).toBe(false);
      expect(result.current.shouldEnterPinCode).toBe(true);
    }
  });

  it('saves with the session PIN and keeps no copy of it in the data', () => {
    const { hook, stored } = run(initUserDataHolder(wallet(), false, '2580'), '2580');
    act(() => hook.result.current.setUserData({ ...hook.result.current.userData, assets: [] }));
    const saved = cypherService.decrypt<UserData>(stored().encryptedData, '2580');
    expect(stored().pinCodeEncrypted).toBe(true);
    expect('pinCode' in saved.settings).toBe(false);
  });

  it('drops the PIN copy older wallets kept in settings on the next save', () => {
    const legacy = { ...wallet(), settings: { ...new UserSettings(), pinCode: '2580' } };
    const holder = new UserDataHolder(true, cypherService.encrypt(legacy, '2580'), false);
    const { hook, stored } = run(holder, '2580');
    expect(hook.result.current.loggedIn).toBe(true);
    act(() => hook.result.current.setUserData({ ...hook.result.current.userData }));
    expect('pinCode' in cypherService.decrypt<UserData>(stored().encryptedData, '2580').settings).toBe(false);
  });

  it('re-encrypts a wallet without a PIN when one is set', () => {
    const { hook, stored } = run(initUserDataHolder(wallet()), null);
    expect(hook.result.current.userDataHolder.pinCodeEncrypted).toBe(false);
    act(() => hook.result.current.setUserDataPin('4321'));
    expect(stored().pinCodeEncrypted).toBe(true);
    expect(cypherService.decrypt<UserData>(stored().encryptedData, '4321').id).toBe('u1');
    expect(() => cypherService.decrypt(stored().encryptedData, DEFAULT_PIN_CODE)).toThrow();
  });

  it('saves nothing while locked', () => {
    const { hook, stored } = run(initUserDataHolder(wallet(), false, '2580'), '1111');
    const before = stored();
    act(() => hook.result.current.setUserData(wallet()));
    act(() => hook.result.current.setUserDataPin('9999'));
    expect(stored()).toBe(before);
  });
});
