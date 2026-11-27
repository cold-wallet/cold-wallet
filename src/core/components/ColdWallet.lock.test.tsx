import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ColdWallet from './ColdWallet';
import inMemoryStorageFactory from '../../web/storage/InMemoryStorageFactory';
import { sealUserDataHolder } from '../services/UserDataService';
import { newPinKey } from '../services/PinVault';
import UserData, { UserSettings } from '../domain/UserData';
import UserDataHolder from '../domain/UserDataHolder';
import type UserDataStorageFactory from '../domain/UserDataStorageFactory';
import { dataImporter } from './settings/ImportData';

// setupTests replaces ColdWallet with a stub for the other tests; this one needs the real thing.
vi.unmock('./ColdWallet');

// Binance stands in for the exchanges: each fetch records whether that render allowed loading.
const { loadBinance } = vi.hoisted(() => ({ loadBinance: vi.fn() }));
vi.mock('../integrations/binance/BinanceLoader', () => ({
  default: (_demo: boolean, loadingAllowed: boolean) => ({
    binancePrices: null, binancePricesLoaded: true,
    binanceCurrencies: null, binanceCurrenciesLoaded: true,
    binanceUserData: null, setBinanceUserData: () => {},
    loadBinanceUserData: () => loadBinance(loadingAllowed),
  }),
}));

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

async function showLocked() {
  const wallet = memoryWallet(await sealed('2580'));
  render(<ColdWallet properties={{
    storageFactory: inMemoryStorageFactory,
    userDataStorageFactory: wallet.factory,
    integrationUserDataStorageFactory: inMemoryStorageFactory,
  }} />);
  return wallet;
}

async function start() {
  const wallet = await showLocked();
  await enterPin('2580');
  return wallet;
}

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

describe('locking the open wallet', () => {
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

describe('forgot PIN: the start screen over the locked wallet', () => {
  async function toStartScreen() {
    const wallet = await showLocked();
    fireEvent.click(await screen.findByText('Forgot PIN?'));
    fireEvent.click(screen.getByText('Go to start screen'));
    await screen.findByRole('note');
    return wallet;
  }

  it('goes back to the PIN and keeps the wallet', async () => {
    await toStartScreen();
    fireEvent.click(screen.getByText('Back to unlock'));
    await enterPin('2580');
  });

  it('replaces the locked wallet with a new one after its PIN is confirmed', async () => {
    await toStartScreen();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Create new wallet'));
    for (let i = 0; i < 2; i++) {
      for (const d of '9999') fireEvent.click(screen.getByRole('button', { name: d }));
      fireEvent.click(screen.getByTitle('Confirm'));
    }
    await screen.findByTitle('Settings');
    fireEvent.click(screen.getByTitle('Lock'));
    await enterPin('9999');
  });
});

describe('exchange balances', () => {
  it('are fetched for the opened wallet right after unlocking', async () => {
    loadBinance.mockClear();
    await start();
    await waitFor(() => expect(loadBinance).toHaveBeenCalledWith(true));
  });

  it('are fetched again after a backup is imported in Settings', async () => {
    await start();
    loadBinance.mockClear();
    fireEvent.click(screen.getByTitle('Settings'));
    fireEvent.click(await screen.findByText('Import'));
    fireEvent.change(await screen.findByPlaceholderText(/Paste your backup token/), {
      target: { value: dataImporter.generateExportData(await sealed('2580')) },
    });
    fireEvent.click(screen.getByText('Restore'));
    await screen.findByText('Enter backup PIN');
    for (const d of '2580') fireEvent.click(screen.getByRole('button', { name: d }));
    fireEvent.click(screen.getByTitle('Confirm'));
    await waitFor(() => expect(loadBinance).toHaveBeenCalledWith(true));
  });
});

describe('copying the backup token', () => {
  function clipboard(writeText: () => Promise<void>) {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  }
  function execCommand(result: boolean) {
    Object.defineProperty(document, 'execCommand', { value: vi.fn(() => result), configurable: true });
  }
  afterEach(() => {
    delete (navigator as { clipboard?: unknown }).clipboard;
    delete (document as { execCommand?: unknown }).execCommand;
  });

  it('says Copied once the browser has copied it', async () => {
    clipboard(() => Promise.resolve());
    await start();
    await openExport();
    fireEvent.click(screen.getByText('Copy token'));
    await screen.findByText('Copied');
  });

  it('copies it the old way where the clipboard API is missing, as in some in-app browsers', async () => {
    execCommand(true);
    await start();
    await openExport();
    fireEvent.click(screen.getByText('Copy token'));
    await screen.findByText('Copied');
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('says so and selects the token when the browser refuses both ways', async () => {
    clipboard(() => Promise.reject(new Error('denied')));
    execCommand(false);
    await start();
    await openExport();
    fireEvent.click(screen.getByText('Copy token'));
    expect((await screen.findByRole('alert')).textContent).toMatch(/didn't allow copying/);
    expect(screen.queryByText('Copied')).toBeNull();
    expect(window.getSelection()?.toString()).toBe(document.querySelector('.token-box code')!.textContent);
  });
});
