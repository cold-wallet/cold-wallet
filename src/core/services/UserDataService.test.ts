import { useState } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import UserDataService, { initUserDataHolder, sealUserDataHolder, type ImportedWallet } from './UserDataService';
import cypherService from './CypherService';
import { DEFAULT_KDF, isSealed, NewerFormatError, newPinKey, open, seal, setKdfParamsForTests } from './PinVault';
import UserData, { UserSettings } from '../domain/UserData';
import UserDataHolder from '../domain/UserDataHolder';
import type UserDataStorageFactory from '../domain/UserDataStorageFactory';

// In-memory storage seeded with `initial`; `stored()` reads what the service last saved, and
// `saveElsewhere()` replaces it the way another tab would.
function memoryStorage(initial: UserDataHolder) {
  let last = initial;
  let set: (h: UserDataHolder) => void = () => {};
  function useHolder() {
    const [value, setValue] = useState(initial);
    last = value;
    set = setValue;
    return [value, setValue] as ReturnType<UserDataStorageFactory['createStorage']>;
  }
  const factory: UserDataStorageFactory = { createStorage: useHolder };
  return { factory, stored: () => last, saveElsewhere: (h: UserDataHolder) => act(() => set(h)) };
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

  it('stays locked when a save started before the lock completes afterwards', async () => {
    const { svc, stored } = run(await sealed('2580'));
    await act(async () => { await svc().unlock('2580'); });
    const lateSave = svc().setUserData; // e.g. held by a request still in flight
    const data = svc().userData;
    act(() => svc().lock('idle'));
    const before = stored();
    act(() => lateSave({ ...data, lastOnline: 9 }));
    await settle();
    expect(svc().loggedIn).toBe(false);
    expect(svc().lockReason).toBe('idle');
    expect(stored()).toBe(before);
  });

  it('leaves the PIN unchanged and the wallet locked when it locks during a PIN change', async () => {
    const { svc, stored } = run(await sealed('2580'));
    await act(async () => { await svc().unlock('2580'); });
    await act(async () => {
      const change = svc().setUserDataPin('9999');
      svc().lock('idle');
      await change;
    });
    await settle();
    expect(svc().loggedIn).toBe(false);
    expect((await open<UserData>(stored().encryptedData, '2580')).data.id).toBe('u1');
  });

  it('keeps a change saved while the new PIN key is being derived', async () => {
    const { svc, stored } = run(await sealed('2580'));
    await act(async () => { await svc().unlock('2580'); });
    await act(async () => {
      const change = svc().setUserDataPin('9999');
      svc().setUserData({ ...svc().userData, lastOnline: 42 });
      await change;
    });
    await settle();
    expect((await open<UserData>(stored().encryptedData, '9999')).data.lastOnline).toBe(42);
  });

  it('follows a save made in another tab, and locks when the PIN was changed there', async () => {
    const { svc, stored, saveElsewhere } = run(await sealed('2580'));
    await act(async () => { await svc().unlock('2580'); });
    const { pinKey } = await open<UserData>(stored().encryptedData, '2580');
    const elsewhere = new UserDataHolder(true, await seal({ ...wallet(), lastOnline: 7 }, pinKey), false);
    saveElsewhere(elsewhere);
    await waitFor(() => expect(svc().userData.lastOnline).toBe(7));
    expect(svc().loggedIn).toBe(true);

    saveElsewhere(await sealed('9999'));
    await waitFor(() => expect(svc().loggedIn).toBe(false));
    expect(svc().lockReason).toBe('elsewhere');
    let ok = true;
    await act(async () => { ok = await svc().unlock('2580'); });
    expect(ok).toBe(false);
    await act(async () => { ok = await svc().unlock('9999'); });
    expect(ok).toBe(true);
  });

  it('says when the stored wallet was saved by a newer version, and keeps it', async () => {
    const newer = new UserDataHolder(true, 'cw3.' + btoa('{"v":3}'), false);
    const { svc, stored } = run(newer);
    await act(async () => {
      await expect(svc().unlock('2580')).rejects.toBeInstanceOf(NewerFormatError);
    });
    expect(stored()).toBe(newer);
  });

  it('re-saves with today\'s key parameters a wallet locked with weaker ones', async () => {
    const today = { alg: 'argon2id' as const, m: 64, t: 1, p: 1 };
    setKdfParamsForTests({ ...today, m: 32 });
    const weak = await sealed('2580');
    setKdfParamsForTests(today);
    const { svc, stored } = run(weak);
    await act(async () => { await svc().unlock('2580'); });
    const kdfOf = (h: UserDataHolder) => JSON.parse(atob(h.encryptedData.slice(4))).kdf;
    expect(kdfOf(weak).m).toBe(32);
    expect(kdfOf(stored()).m).toBe(64);
    expect((await open<UserData>(stored().encryptedData, '2580')).data.id).toBe('u1');
    expect(DEFAULT_KDF.m).toBeGreaterThan(today.m); // the real parameters are far stronger
  });
});
