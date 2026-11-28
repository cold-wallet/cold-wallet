import { act, renderHook, waitFor } from '@testing-library/react';
import useRefreshTracker from '../../refresh/useRefreshTracker';
import CcxtLoader, { CcxtAccountsData, keepEnabledCcxt, mergeCcxtSync, savedEnabledCcxtIntegrations } from './CcxtLoader';
import StorageFactory from '../../domain/StorageFactory';
import StorageRepositoryFactory from '../../../web/storage/StorageRepositoryFactory';
import InMemoryStorage from '../../../web/storage/InMemoryStorage';
import ApiResponse from '../../domain/ApiResponse';
import AssetDTO, { AssetType } from '../../domain/AssetDTO';
import UserData, { IntegrationSettingsData } from '../../domain/UserData';

const { connector } = vi.hoisted(() => ({ connector: { loadUserData: vi.fn() } }));
vi.mock('./ccxtConnector', () => ({ default: connector }));

/** the loader as ColdWallet runs it: with a refresh tracker of its own */
const useCcxt = (allowed: boolean, storage: StorageFactory, user: UserData) => CcxtLoader(allowed, storage, user, useRefreshTracker());

const coin = (exchange: string, currency: string) =>
  new AssetDTO(`${exchange}_${currency} SPOT`, currency, '1', `${currency} SPOT`, 8, AssetType.crypto, false, false, false, true, exchange);
const integration = (enabled: boolean) => ({ enabled, apiKey: 'test-key', apiSecret: 'test-secret', password: null, additionalSetting: null } as IntegrationSettingsData);
const wallet = (id: string, integrations: Record<string, IntegrationSettingsData>) => {
  const u = new UserData(id);
  u.settings.integrations = integrations;
  return u;
};
/** a fresh device: storage that no other test has written to */
const device = (saved?: CcxtAccountsData): StorageFactory => {
  const storage = new InMemoryStorage();
  if (saved) storage.setItem('ccxtUserData', JSON.stringify(saved));
  const [repo, nullable] = StorageRepositoryFactory(storage);
  return { createStorage: repo, createStorageNullable: nullable };
};
const currencies = (d: CcxtAccountsData) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v.map((a) => a.currency)]));

beforeEach(() => connector.loadUserData.mockReset());

describe('mergeCcxtSync', () => {
  const saved = { kraken: [coin('kraken', 'BTC')], bybit: [coin('bybit', 'ETH')] };

  it('stores an empty answer: everything on that exchange was sold', () => {
    const next = mergeCcxtSync(saved, ['kraken', 'bybit'], [['kraken', ApiResponse.success(200, [])], ['bybit', ApiResponse.success(200, [coin('bybit', 'SOL')])]]);
    expect(currencies(next)).toEqual({ kraken: [], bybit: ['SOL'] });
  });

  it('keeps the last balances of an exchange whose request failed', () => {
    const next = mergeCcxtSync(saved, ['kraken', 'bybit'], [['kraken', ApiResponse.fail(0, 'timeout')], ['bybit', ApiResponse.success(200, [])]]);
    expect(currencies(next)).toEqual({ kraken: ['BTC'], bybit: [] });
  });

  it('ignores the answer of an exchange switched off meanwhile, and keeps the others as they are', () => {
    const next = mergeCcxtSync(saved, ['bybit'], [['kraken', ApiResponse.success(200, [coin('kraken', 'XRP')])], ['bybit', ApiResponse.success(200, [])]]);
    expect(currencies(next)).toEqual({ kraken: ['BTC'], bybit: [] });
  });
});

describe('keepEnabledCcxt', () => {
  const saved = { kraken: [coin('kraken', 'BTC')], bybit: [coin('bybit', 'ETH')] };

  it('drops exchanges that are not switched on', () => {
    expect(currencies(keepEnabledCcxt(saved, ['bybit']))).toEqual({ bybit: ['ETH'] });
  });

  it('returns the same object when nothing goes', () => {
    expect(keepEnabledCcxt(saved, ['bybit', 'kraken'])).toBe(saved);
  });
});

describe('savedEnabledCcxtIntegrations', () => {
  it('lists only exchanges switched on in the saved settings', () => {
    expect(savedEnabledCcxtIntegrations(wallet('w', { kraken: integration(true), bybit: integration(false) }))).toEqual(['kraken']);
    expect(savedEnabledCcxtIntegrations(new UserData('w'))).toEqual([]);
  });
});

describe('CcxtLoader', () => {
  it('a locked wallet syncs nothing and keeps the saved balances', async () => {
    const saved = { kraken: [coin('kraken', 'BTC')] };
    const { result } = renderHook(() => useCcxt(false, device(saved), new UserData('unauthorized')));
    await act(async () => {});
    expect(connector.loadUserData).not.toHaveBeenCalled();
    expect(currencies(result.current.ccxtUserData)).toEqual({ kraken: ['BTC'] });
  });

  it('after an unlock: the switches follow the opened settings, and a sync keeps an enabled exchange', async () => {
    connector.loadUserData.mockResolvedValue(ApiResponse.success(200, [coin('kraken', 'BTC'), coin('kraken', 'XRP')]));
    const saved = { kraken: [coin('kraken', 'BTC')] };
    const { result, rerender } = renderHook(({ allowed, user }) => useCcxt(allowed, device(saved), user),
      { initialProps: { allowed: false, user: new UserData('unauthorized') } });
    expect(result.current.enabledCcxtIntegrations.size).toBe(0);

    rerender({ allowed: true, user: wallet('w1', { kraken: integration(true) }) });
    await waitFor(() => expect([...result.current.enabledCcxtIntegrations]).toEqual(['kraken']));
    await act(async () => result.current.loadCcxtUserData());
    expect(connector.loadUserData).toHaveBeenCalledWith('kraken', 'test-key', 'test-secret', null, null);
    expect(currencies(result.current.ccxtUserData)).toEqual({ kraken: ['BTC', 'XRP'] });
  });

  it('a sync in flight while an exchange is switched on keeps the balances its check just loaded', async () => {
    let answer: (r: unknown) => void = () => {};
    connector.loadUserData.mockReturnValue(new Promise((r) => { answer = r; }));
    const { result, rerender } = renderHook(({ user }) => useCcxt(true, device(), user),
      { initialProps: { user: wallet('w', { bybit: integration(true), kraken: integration(false) }) } });
    await waitFor(() => expect(connector.loadUserData).toHaveBeenCalledTimes(1)); // syncing [bybit]

    // switching Kraken on: its check stores the balances, then the flag is saved
    await act(async () => result.current.setCcxtUserData((d) => ({ ...d, kraken: [coin('kraken', 'BTC')] })));
    rerender({ user: wallet('w', { bybit: integration(true), kraken: integration(true) }) });
    await act(async () => answer(ApiResponse.success(200, [coin('bybit', 'ETH')])));
    expect(currencies(result.current.ccxtUserData)).toEqual({ kraken: ['BTC'], bybit: ['ETH'] });
  });

  it('switching an exchange off drops its saved balances; a locked wallet drops nothing', async () => {
    const storage = device({ kraken: [coin('kraken', 'BTC')], bybit: [coin('bybit', 'ETH')] });
    const both = wallet('w', { kraken: integration(true), bybit: integration(true) });
    const { result, rerender } = renderHook(({ allowed, user }) => useCcxt(allowed, storage, user),
      { initialProps: { allowed: false, user: new UserData('unauthorized') } });
    await act(async () => {});
    expect(Object.keys(result.current.ccxtUserData).sort()).toEqual(['bybit', 'kraken']);

    rerender({ allowed: true, user: both });
    await act(async () => {});
    expect(Object.keys(result.current.ccxtUserData).sort()).toEqual(['bybit', 'kraken']);

    rerender({ allowed: true, user: wallet('w', { kraken: integration(false), bybit: integration(true) }) });
    await waitFor(() => expect(Object.keys(result.current.ccxtUserData)).toEqual(['bybit']));
  });

  it('a sync started for one wallet does not land in the wallet that replaced it', async () => {
    let answer: (r: unknown) => void = () => {};
    connector.loadUserData.mockReturnValue(new Promise((r) => { answer = r; }));
    const { result, rerender } = renderHook(({ user }) => useCcxt(true, device(), user),
      { initialProps: { user: wallet('old', { kraken: integration(true) }) } });
    await waitFor(() => expect(connector.loadUserData).toHaveBeenCalled());

    rerender({ user: wallet('new', {}) });
    await act(async () => answer(ApiResponse.success(200, [coin('kraken', 'BTC')])));
    expect(result.current.ccxtUserData).toEqual({});
  });
});
