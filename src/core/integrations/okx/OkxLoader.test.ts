import { act, renderHook, waitFor } from '@testing-library/react';
import OkxLoader from './OkxLoader';
import { accountDetails, OkxAccount } from './okxApiClient';
import useRefreshTracker from '../../refresh/useRefreshTracker';
import { stateOf } from '../../refresh/refreshState';
import { okxCoinScope } from '../../refresh/scopeKeys';
import StorageFactory from '../../domain/StorageFactory';
import StorageRepositoryFactory from '../../../web/storage/StorageRepositoryFactory';
import InMemoryStorage from '../../../web/storage/InMemoryStorage';
import ApiResponse from '../../domain/ApiResponse';
import AssetDTO, { AssetType } from '../../domain/AssetDTO';

const { api } = vi.hoisted(() => ({
  api: { fetchPrices: vi.fn(), fetchCurrencies: vi.fn(), fetchSpotBalances: vi.fn(), fetchSubAccountBalances: vi.fn() },
}));
vi.mock('./okxApiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./okxApiClient')>();
  return { ...actual, default: api };
});

const coin = (type: string, currency: string, amount = '1') =>
  new AssetDTO(`okx_${type}_${currency}`, currency, amount, `${currency} ${type} OKX`, 8, AssetType.crypto, false, false, true);
const amounts = (account: OkxAccount | null) =>
  Object.fromEntries((account?.spotAccountBalances || []).map((a) => [a.currency, a.amount]));
const device = (saved?: OkxAccount): StorageFactory => {
  const storage = new InMemoryStorage();
  storage.setItem('okxCurrencies', JSON.stringify({ BTC: { symbol: 'BTC', precision: 8 } }));
  if (saved) storage.setItem('okxUserData', JSON.stringify(saved));
  const [repo, nullable] = StorageRepositoryFactory(storage);
  return { createStorage: repo, createStorageNullable: nullable };
};

function render(storage: StorageFactory) {
  return renderHook(() => {
    const tracker = useRefreshTracker();
    return { tracker, ...OkxLoader(false, true, storage, storage, true, 'test-key', 'test-secret', 'test-pass', null, tracker) };
  });
}

beforeEach(() => {
  api.fetchPrices.mockReset().mockResolvedValue(ApiResponse.success(200, {}));
  api.fetchCurrencies.mockReset().mockResolvedValue(ApiResponse.success(200, { BTC: { symbol: 'BTC', precision: 8 } }));
  api.fetchSpotBalances.mockReset();
  api.fetchSubAccountBalances.mockReset();
});

describe('OKX refresh', () => {
  it('one coin refreshes on its own: only that coin changes, and a coin sold out goes', async () => {
    api.fetchSpotBalances.mockResolvedValueOnce([coin('spot', 'BTC'), coin('spot', 'ETH')]);
    const { result } = render(device());
    await waitFor(() => expect(amounts(result.current.okxUserData)).toEqual({ BTC: '1', ETH: '1' }));

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 15_000);
    try {
      api.fetchSpotBalances.mockResolvedValueOnce([coin('spot', 'BTC', '2')]);
      await act(async () => { await result.current.refreshOkx([okxCoinScope('BTC')]); });
      expect(api.fetchSpotBalances).toHaveBeenLastCalledWith(expect.anything(), expect.anything(), 'BTC');
      expect(amounts(result.current.okxUserData)).toEqual({ BTC: '2', ETH: '1' });

      api.fetchSpotBalances.mockResolvedValueOnce([]);
      await act(async () => { await result.current.refreshOkx([okxCoinScope('ETH')]); });
      expect(amounts(result.current.okxUserData)).toEqual({ BTC: '2' });
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('an answer without the account keeps the balances shown and is retried', async () => {
    api.fetchSpotBalances.mockRejectedValueOnce(new Error('OKX answered without the trading account balances'));
    const { result } = render(device(new OkxAccount([coin('spot', 'BTC')])));
    await waitFor(() => expect(stateOf(result.current.tracker.current(), 'okx/spot').error).not.toBeNull());
    expect(amounts(result.current.okxUserData)).toEqual({ BTC: '1' });
    expect(stateOf(result.current.tracker.current(), 'okx/spot').error?.kind).toBe('retry');
  });
});

describe('OKX balance answers', () => {
  it('an account holding nothing is empty; an answer without the account is an error', () => {
    expect(accountDetails([{ details: [] }], 'trading account')).toEqual([]);
    expect(() => accountDetails([], 'trading account')).toThrow(/without the trading account/);
    expect(() => accountDetails(undefined, 'sub-account')).toThrow(/without the sub-account/);
  });
});
