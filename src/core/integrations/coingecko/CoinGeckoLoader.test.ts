import { act, renderHook, waitFor } from '@testing-library/react';
import CoinGeckoLoader from './CoinGeckoLoader';
import useRefreshTracker from '../../refresh/useRefreshTracker';
import inMemoryStorageFactory from '../../../web/storage/InMemoryStorageFactory';
import ApiResponse from '../../domain/ApiResponse';
import StorageFactory from '../../domain/StorageFactory';
import StorageRepositoryFactory from '../../../web/storage/StorageRepositoryFactory';
import InMemoryStorage from '../../../web/storage/InMemoryStorage';
import { activeUnder } from '../../refresh/refreshState';

const { api } = vi.hoisted(() => ({ api: { fetchCurrencies: vi.fn(), fetchPrices: vi.fn() } }));
vi.mock('./apiClient', () => ({ default: api }));

const directory = {
  BTC: { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
  USDT: { id: 'tether', symbol: 'usdt', name: 'Tether', platforms: { ethereum: '0x' } },
  ODD: { id: 'odd-coin', symbol: 'odd', name: 'Odd' },
};

beforeEach(() => { api.fetchCurrencies.mockReset(); api.fetchPrices.mockReset(); });

describe('CoinGecko: is a price still on the way?', () => {
  it('yes while the coin directory loads, no once it failed to load', async () => {
    let fail: (r: unknown) => void = () => {};
    api.fetchCurrencies.mockReturnValue(new Promise((r) => { fail = r; }));
    const { result } = renderHook(() => CoinGeckoLoader(inMemoryStorageFactory, ['ODD'], useRefreshTracker()));
    expect(result.current.coinGeckoPricePending('ODD')).toBe(true);
    await act(async () => fail(ApiResponse.fail(0, 'blocked')));
    expect(result.current.coinGeckoPricePending('ODD')).toBe(false);
  });

  it('yes for a listed coin until CoinGecko answers, no for a coin it does not list', async () => {
    api.fetchCurrencies.mockResolvedValue(ApiResponse.success(200, directory));
    let answer: (r: unknown) => void = () => {};
    api.fetchPrices.mockReturnValue(new Promise((r) => { answer = r; }));
    const { result } = renderHook(() => CoinGeckoLoader(inMemoryStorageFactory, ['ODD', 'NOPE'], useRefreshTracker()));
    await waitFor(() => expect(api.fetchPrices).toHaveBeenCalled());
    expect(result.current.coinGeckoPricePending('ODD')).toBe(true);
    expect(result.current.coinGeckoPricePending('NOPE')).toBe(false);
    // answered without a price for ODD: none is coming
    await act(async () => answer(ApiResponse.success(200, { btc: { usd: 60000 } })));
    expect(result.current.coinGeckoPricePending('ODD')).toBe(false);
    expect(result.current.coinGeckoPricePending('BTC')).toBe(false); // it has a price
  });
});

describe('CoinGecko: requests stay within its rate limit', () => {
  // a device no other test wrote to (the coin directory is saved there)
  const device = (): StorageFactory => {
    const [repo, nullable] = StorageRepositoryFactory(new InMemoryStorage());
    return { createStorage: repo, createStorageNullable: nullable };
  };
  const coinsAsked = (call: number) => Object.keys(api.fetchPrices.mock.calls[call][0]).sort();
  // in steps, so React renders (and starts the timers of its effects) between them, as in a browser
  const flush = async (ms: number) => {
    for (let t = 0; t < ms; t += 100) await act(async () => { await vi.advanceTimersByTimeAsync(Math.min(100, ms - t)); });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    api.fetchCurrencies.mockResolvedValue(ApiResponse.success(200, directory));
  });
  afterEach(() => vi.useRealTimers());

  it('opening a wallet sends one request, even while its holdings are still arriving', async () => {
    api.fetchPrices.mockResolvedValue(ApiResponse.success(200, {}));
    const storage = device();
    const { rerender } = renderHook(({ coins }) => CoinGeckoLoader(storage, coins, useRefreshTracker()),
      { initialProps: { coins: ['BTC'] } });
    await flush(100);
    rerender({ coins: ['BTC', 'ODD'] });
    await flush(600);
    expect(api.fetchPrices).toHaveBeenCalledTimes(1);
    expect(coinsAsked(0)).toEqual(['BTC', 'ODD', 'USDT']);
  });

  it('coins added while a request is on its way are asked for right after it, not alongside', async () => {
    let answer: (r: unknown) => void = () => undefined;
    api.fetchPrices.mockReturnValueOnce(new Promise((r) => { answer = r; }))
      .mockResolvedValue(ApiResponse.success(200, {}));
    const storage = device();
    const { rerender } = renderHook(({ coins }) => CoinGeckoLoader(storage, coins, useRefreshTracker()),
      { initialProps: { coins: ['BTC'] } });
    await flush(800);
    expect(api.fetchPrices).toHaveBeenCalledTimes(1);
    rerender({ coins: ['BTC', 'ODD'] });
    await flush(800);
    expect(api.fetchPrices).toHaveBeenCalledTimes(1);   // nothing sent alongside
    await act(async () => answer(ApiResponse.success(200, {})));
    await flush(1_100);
    expect(api.fetchPrices).toHaveBeenCalledTimes(2);
    expect(coinsAsked(1)).toContain('ODD');
  });

  it('after a failure: one retry as soon as the minute pause is over, shown spinning until then', async () => {
    api.fetchPrices.mockResolvedValueOnce(ApiResponse.fail(429, 'Too many requests'))
      .mockResolvedValue(ApiResponse.success(200, { btc: { usd: 60000 } }));
    const storage = device();
    const { result } = renderHook(() => {
      const tracker = useRefreshTracker();
      return { tracker, loader: CoinGeckoLoader(storage, ['BTC'], tracker) };
    });
    await flush(800);
    expect(api.fetchPrices).toHaveBeenCalledTimes(1);
    expect(activeUnder(result.current.tracker.status, 'prices/coingecko')).toBe(true);

    await flush(45_000);                                 // the 30 s tick falls in the pause
    expect(api.fetchPrices).toHaveBeenCalledTimes(1);
    await flush(18_000);                                 // pause over → retried within a couple of seconds
    expect(api.fetchPrices).toHaveBeenCalledTimes(2);
    expect(activeUnder(result.current.tracker.status, 'prices/coingecko')).toBe(false);
  });
});
