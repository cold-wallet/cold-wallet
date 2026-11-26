import { useState } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import UserDataService, { initUserDataHolder, sealUserDataHolder, type ImportedWallet } from './UserDataService';
import cypherService from './CypherService';
import { isSealed, newPinKey, open } from './PinVault';
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

function run(holder: UserDataHolder) {
  const storage = memoryStorage(holder);
  const hook = renderHook(() => UserDataService({ storageFactory: storage.factory }));
  return { ...storage, hook, svc: () => hook.result.current };
}

const wallet = (id = 'u1') => new UserData(id, new UserSettings(), []);
const sealed = async (pin: string, data = wallet()) => sealUserDataHolder(data, await newPinKey(pin));
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe('UserDataService', () => {
  it('starts locked, refuses a wrong PIN and unlocks with the right one', async () => {
    const { svc } = run(await sealed('2580'));
    expect(svc().shouldEnterPinCode).toBe(true);
    expect(svc().loggedIn).toBe(false);
    let ok = true;
    await act(async () => { ok = await svc().unlock('1111'); });
    expect(ok).toBe(false);
    expect(svc().shouldEnterPinCode).toBe(true);
    await act(async () => { ok = await svc().unlock('2580'); });
    expect(ok).toBe(true);
    expect(svc().loggedIn).toBe(true);
    expect(svc().shouldEnterPinCode).toBe(false);
    act(() => svc().lock());
    expect(svc().loggedIn).toBe(false);
  });

  it('saves with the in-memory key, in order, keeping no copy of the PIN in the data', async () => {
    const { svc, stored } = run(await sealed('2580'));
    await act(async () => { await svc().unlock('2580'); });
    act(() => svc().setUserData({ ...svc().userData, assets: [] , lastOnline: 1 }));
    act(() => svc().setUserData({ ...svc().userData, lastOnline: 2 }));
    await waitFor(async () => {
      const saved = (await open<UserData>(stored().encryptedData, '2580')).data;
      expect(saved.lastOnline).toBe(2);
      expect('pinCode' in saved.settings).toBe(false);
    });
    expect(isSealed(stored().encryptedData)).toBe(true);
  });

  it('re-saves a wallet from an older version in the current format on unlock', async () => {
    const legacy = { ...wallet('old'), settings: { ...new UserSettings(), pinCode: '2580' } };
    const { svc, stored } = run(new UserDataHolder(true, cypherService.encrypt(legacy, '2580'), false));
    let ok = false;
    await act(async () => { ok = await svc().unlock('2580'); });
    expect(ok).toBe(true);
    expect(svc().userData.id).toBe('old');
    expect(isSealed(stored().encryptedData)).toBe(true);
    const saved = (await open<UserData>(stored().encryptedData, '2580')).data;
    expect('pinCode' in saved.settings).toBe(false);
  });

  it('locks a wallet without a PIN when one is set, and changes it later', async () => {
    const { svc, stored } = run(initUserDataHolder(wallet()));
    expect(svc().loggedIn).toBe(true);
    await act(async () => { await svc().setUserDataPin('4321'); });
    expect(stored().pinCodeEncrypted).toBe(true);
    expect(svc().loggedIn).toBe(true); // stays unlocked
    expect(await svc().verifyPin('4321')).toBe(true);
    await act(async () => { await svc().setUserDataPin('9999'); });
    expect(await svc().verifyPin('4321')).toBe(false);
    expect((await open<UserData>(stored().encryptedData, '9999')).data.id).toBe('u1');
  });

  it('saves nothing while locked', async () => {
    const { svc, stored } = run(await sealed('2580'));
    const before = stored();
    act(() => svc().setUserData(wallet()));
    await act(async () => { await svc().setUserDataPin('9999'); });
    await settle();
    expect(stored()).toBe(before);
  });

  it('creates a new wallet unlocked, replacing the stored one', async () => {
    const { svc, stored } = run(await sealed('2580', wallet('old')));
    await act(async () => { await svc().createWallet(wallet('new'), '1357'); });
    expect(svc().userData.id).toBe('new');
    expect((await open<UserData>(stored().encryptedData, '1357')).data.id).toBe('new');
  });

  it('imports an older-format PIN backup by re-saving it with that PIN', async () => {
    const { svc, stored } = run(initUserDataHolder(new UserData()));
    const imported: ImportedWallet = {
      holder: new UserDataHolder(true, cypherService.encrypt(wallet('bk'), '4321'), false),
      data: wallet('bk'),
      pinKey: null,
    };
    await act(async () => { await svc().importWallet(imported, '4321'); });
    expect(svc().userData.id).toBe('bk');
    expect((await open<UserData>(stored().encryptedData, '4321')).data.id).toBe('bk');
  });

  it('drops a save still in flight when the wallet is replaced', async () => {
    const { svc, stored } = run(await sealed('2580', wallet('old')));
    await act(async () => { await svc().unlock('2580'); });
    // the import finishes while the save is still being encrypted
    const imported: ImportedWallet = { holder: initUserDataHolder(wallet('new')), data: wallet('new'), pinKey: null };
    await act(async () => {
      svc().setUserData({ ...svc().userData, lastOnline: 5 });
      for (let i = 0; i < 3; i++) await Promise.resolve(); // the save is now encrypting
      await svc().importWallet(imported);
    });
    await settle();
    expect(stored().pinCodeEncrypted).toBe(false);
    expect(cypherService.decrypt<UserData>(stored().encryptedData, '0123456789').id).toBe('new');
  });
});
