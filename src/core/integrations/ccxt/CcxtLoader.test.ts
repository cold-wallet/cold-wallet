import { act, renderHook, waitFor } from '@testing-library/react';
import CcxtLoader, { CcxtAccountsData, mergeCcxtSync, savedEnabledCcxtIntegrations } from './CcxtLoader';
import StorageFactory from '../../domain/StorageFactory';
import StorageRepositoryFactory from '../../../web/storage/StorageRepositoryFactory';
import InMemoryStorage from '../../../web/storage/InMemoryStorage';
import ApiResponse from '../../domain/ApiResponse';
import AssetDTO, { AssetType } from '../../domain/AssetDTO';
import UserData, { IntegrationSettingsData } from '../../domain/UserData';

const { connector } = vi.hoisted(() => ({ connector: { loadUserData: vi.fn() } }));
vi.mock('./ccxtConnector', () => ({ default: connector }));

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

  it('drops exchanges that are no longer switched on', () => {
    expect(currencies(mergeCcxtSync(saved, ['bybit'], [['bybit', ApiResponse.fail(0, 'timeout')]]))).toEqual({ bybit: ['ETH'] });
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
    const { result } = renderHook(() => CcxtLoader(false, device(saved), new UserData('unauthorized')));
    await act(async () => {});
    expect(connector.loadUserData).not.toHaveBeenCalled();
    expect(currencies(result.current.ccxtUserData)).toEqual({ kraken: ['BTC'] });
  });

  it('after an unlock: the switches follow the opened settings, and a sync keeps an enabled exchange', async () => {
    connector.loadUserData.mockResolvedValue(ApiResponse.success(200, [coin('kraken', 'BTC'), coin('kraken', 'XRP')]));
    const saved = { kraken: [coin('kraken', 'BTC')] };
    const { result, rerender } = renderHook(({ allowed, user }) => CcxtLoader(allowed, device(saved), user),
      { initialProps: { allowed: false, user: new UserData('unauthorized') } });
    expect(result.current.enabledCcxtIntegrations.size).toBe(0);

    rerender({ allowed: true, user: wallet('w1', { kraken: integration(true) }) });
    await waitFor(() => expect([...result.current.enabledCcxtIntegrations]).toEqual(['kraken']));
    await act(async () => result.current.loadCcxtUserData());
    expect(connector.loadUserData).toHaveBeenCalledWith('kraken', 'test-key', 'test-secret', null, null);
    expect(currencies(result.current.ccxtUserData)).toEqual({ kraken: ['BTC', 'XRP'] });
  });

  it('a sync started for one wallet does not land in the wallet that replaced it', async () => {
    let answer: (r: unknown) => void = () => {};
    connector.loadUserData.mockReturnValue(new Promise((r) => { answer = r; }));
    const { result, rerender } = renderHook(({ user }) => CcxtLoader(true, device(), user),
      { initialProps: { user: wallet('old', { kraken: integration(true) }) } });
    await waitFor(() => expect(connector.loadUserData).toHaveBeenCalled());

    rerender({ user: wallet('new', {}) });
    await act(async () => answer(ApiResponse.success(200, [coin('kraken', 'BTC')])));
    expect(result.current.ccxtUserData).toEqual({});
  });
});
