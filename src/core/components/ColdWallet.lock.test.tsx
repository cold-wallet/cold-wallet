import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ColdWallet from './ColdWallet';
import inMemoryStorageFactory from '../../web/storage/InMemoryStorageFactory';
import { sealUserDataHolder } from '../services/UserDataService';
import { newPinKey } from '../services/PinVault';
import UserData, { UserSettings } from '../domain/UserData';
import UserDataHolder from '../domain/UserDataHolder';
import type UserDataStorageFactory from '../domain/UserDataStorageFactory';

// setupTests replaces ColdWallet with a stub for the other tests; this one needs the real thing.
vi.unmock('./ColdWallet');

// The wallet lives in memory; `saveElsewhere()` replaces it the way another tab would.
function memoryWallet(initial: UserDataHolder) {
  let set: (h: UserDataHolder) => void = () => {};
  function useHolder() {
    const [value, setValue] = useState(initial);
    set = setValue;
    return [value, setValue] as ReturnType<UserDataStorageFactory['createStorage']>;
  }
  return { factory: { createStorage: useHolder } as UserDataStorageFactory, saveElsewhere: (h: UserDataHolder) => act(() => set(h)) };
}

const sealed = async (pin: string) => sealUserDataHolder(new UserData('u1', new UserSettings(), []), await newPinKey(pin));

async function enterPin(pin: string) {
  await screen.findByText('Enter PIN-code');
  for (const d of pin) fireEvent.click(screen.getByRole('button', { name: d }));
  fireEvent.click(screen.getByTitle('Confirm'));
  await screen.findByTitle('Settings');
}

async function openExport() {
  fireEvent.click(screen.getByTitle('Settings'));
  fireEvent.click(await screen.findByText('Export'));
  await screen.findByText('Export backup');
}

async function start() {
  const wallet = memoryWallet(await sealed('2580'));
  render(<ColdWallet properties={{
    storageFactory: inMemoryStorageFactory,
    userDataStorageFactory: wallet.factory,
    integrationUserDataStorageFactory: inMemoryStorageFactory,
  }} />);
  await enterPin('2580');
  return wallet;
}

describe('locking the open wallet', () => {
  beforeEach(() => {
    // market data loaders have nothing to reach in tests
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('closes what was open when the Lock button is used', async () => {
    await start();
    await openExport();
    fireEvent.click(screen.getByTitle('Lock'));
    await enterPin('2580');
    expect(screen.queryByText('Export backup')).toBeNull();
  });

  it('closes what was open when the PIN is changed in another tab', async () => {
    const wallet = await start();
    await openExport();
    wallet.saveElsewhere(await sealed('1111'));
    await screen.findByText(/changed in another tab/);
    await enterPin('1111');
    expect(screen.queryByText('Export backup')).toBeNull();
  });
});
