import { act, renderHook, waitFor } from '@testing-library/react';
import CoinGeckoLoader from './CoinGeckoLoader';
import inMemoryStorageFactory from '../../../web/storage/InMemoryStorageFactory';
import ApiResponse from '../../domain/ApiResponse';

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
    const { result } = renderHook(() => CoinGeckoLoader(inMemoryStorageFactory, ['ODD']));
    expect(result.current.coinGeckoPricePending('ODD')).toBe(true);
    await act(async () => fail(ApiResponse.fail(0, 'blocked')));
    expect(result.current.coinGeckoPricePending('ODD')).toBe(false);
  });

  it('yes for a listed coin until CoinGecko answers, no for a coin it does not list', async () => {
    api.fetchCurrencies.mockResolvedValue(ApiResponse.success(200, directory));
    let answer: (r: unknown) => void = () => {};
    api.fetchPrices.mockReturnValue(new Promise((r) => { answer = r; }));
    const { result } = renderHook(() => CoinGeckoLoader(inMemoryStorageFactory, ['ODD', 'NOPE']));
    await waitFor(() => expect(api.fetchPrices).toHaveBeenCalled());
    expect(result.current.coinGeckoPricePending('ODD')).toBe(true);
    expect(result.current.coinGeckoPricePending('NOPE')).toBe(false);
    // answered without a price for ODD: none is coming
    await act(async () => answer(ApiResponse.success(200, { btc: { usd: 60000 } })));
    expect(result.current.coinGeckoPricePending('ODD')).toBe(false);
    expect(result.current.coinGeckoPricePending('BTC')).toBe(false); // it has a price
  });
});
