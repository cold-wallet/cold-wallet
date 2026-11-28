import { act, renderHook, waitFor } from '@testing-library/react';
import BinanceLoader from './BinanceLoader';
import { AccountInfo, BinanceSection } from './binanceApiClient';
import useRefreshTracker from '../../refresh/useRefreshTracker';
import { activeUnder, stateOf } from '../../refresh/refreshState';
import StorageFactory from '../../domain/StorageFactory';
import StorageRepositoryFactory from '../../../web/storage/StorageRepositoryFactory';
import InMemoryStorage from '../../../web/storage/InMemoryStorage';
import ApiResponse from '../../domain/ApiResponse';
import AssetDTO, { AssetType } from '../../domain/AssetDTO';

const { api } = vi.hoisted(() => ({
  api: { fetchBinancePrices: vi.fn(), fetchBinanceCurrencies: vi.fn(), getUserInfoAsync: vi.fn() },
}));
vi.mock('./binanceApiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./binanceApiClient')>();
  return { ...actual, default: api };
});

type OnSection = (section: BinanceSection, info: AccountInfo, error?: unknown) => void;
const coin = (id: string, currency: string) => new AssetDTO(id, currency, '1', currency, 8, AssetType.crypto, true);
/** a device no other test wrote to, optionally with balances saved on an earlier visit */
const device = (saved?: AccountInfo): StorageFactory => {
  const storage = new InMemoryStorage();
  storage.setItem('binanceCurrencies', JSON.stringify({ BTC: { symbol: 'BTC', precision: 8 } }));
  if (saved) storage.setItem('binanceUserData', JSON.stringify(saved));
  const [repo, nullable] = StorageRepositoryFactory(storage);
  return { createStorage: repo, createStorageNullable: nullable };
};
/** the API answers each section with one coin named after it; `failing` sections fail */
const answering = (failing: BinanceSection[] = []) =>
  async (_k: string, _s: string, _c: unknown, data: AccountInfo | null, sections: Set<BinanceSection>, onSection: OnSection) => {
    const info: AccountInfo = { ...(data || new AccountInfo()) };
    sections.forEach((section) => {
      if (failing.includes(section)) { onSection(section, { ...info }, new TypeError('Failed to fetch')); return; }
      if (section === 'funding') info.funding = [coin('binance_funding_NEW', 'NEW')];
      onSection(section, { ...info });
    });
    return info;
  };

function render(storage: StorageFactory, keys = { key: 'test-key', secret: 'test-secret' }) {
  return renderHook(({ key, secret }) => {
    const tracker = useRefreshTracker();
    return { tracker, ...BinanceLoader(false, true, storage, storage, true, key, secret, tracker) };
  }, { initialProps: keys });
}

beforeEach(() => {
  api.fetchBinancePrices.mockReset().mockResolvedValue(ApiResponse.success(200, {}));
  api.fetchBinanceCurrencies.mockReset().mockResolvedValue(ApiResponse.success(200, { BTC: { symbol: 'BTC', precision: 8 } }));
  api.getUserInfoAsync.mockReset();
});

describe('Binance refresh, section by section', () => {
  it('a failed section keeps its last balances and is retried; the others land', async () => {
    api.getUserInfoAsync.mockImplementation(answering(['funding']));
    const saved = new AccountInfo(undefined, [], [], [], [], [coin('binance_funding_OLD', 'OLD')]);
    const { result } = render(device(saved));
    await waitFor(() => expect(api.getUserInfoAsync).toHaveBeenCalled());
    await act(async () => { await Promise.resolve(); });

    expect(result.current.binanceUserData?.funding?.map((a) => a.currency)).toEqual(['OLD']);
    expect(stateOf(result.current.tracker.current(), 'binance/funding').error?.kind).toBe('retry');
    expect(stateOf(result.current.tracker.current(), 'binance/spot').lastSuccessAt).toBeGreaterThan(0);
    expect(activeUnder(result.current.tracker.current(), 'binance')).toBe(true); // waits for the retry
  });

  it('a manual refresh of a fresh section answers without a request; a stale one loads', async () => {
    api.getUserInfoAsync.mockImplementation(answering());
    const { result } = render(device());
    await waitFor(() => expect(api.getUserInfoAsync).toHaveBeenCalledTimes(1));
    await act(async () => { await result.current.refreshBinance(['funding']); });
    expect(api.getUserInfoAsync).toHaveBeenCalledTimes(1);              // loaded a moment ago

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 15_000);
    try {
      await act(async () => { await result.current.refreshBinance(['funding']); });
      expect(api.getUserInfoAsync).toHaveBeenCalledTimes(2);
      expect([...api.getUserInfoAsync.mock.calls[1][4]]).toEqual(['funding']); // only that section
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('a load for a wallet replaced meanwhile stores nothing, and the new wallet does not wait for it', async () => {
    let finishOld: OnSection = () => undefined;
    let release: () => void = () => undefined;
    api.getUserInfoAsync.mockImplementationOnce((_k, _s, _c, _d, _sections, onSection: OnSection) => {
      finishOld = onSection;
      return new Promise<void>((r) => { release = r; });
    });
    const { result } = render(device());
    await waitFor(() => expect(api.getUserInfoAsync).toHaveBeenCalledTimes(1));

    // another wallet opens: balances dropped, refresh state reset, its sources loaded
    api.getUserInfoAsync.mockImplementation(answering());
    act(() => { result.current.tracker.reset(); result.current.setBinanceUserData(null); });
    act(() => result.current.loadBinanceUserData());
    // a serial runner: the new load goes after the old one, but it is sent, not joined
    await act(async () => { finishOld('spot', new AccountInfo({ accountType: 'SPOT', balances: [coin('binance_SPOT_OLD', 'OLD')] } as never)); });
    expect(result.current.binanceUserData?.account?.balances?.map((a) => a.currency)).toBeUndefined();
    await act(async () => { release(); });
    await waitFor(() => expect(api.getUserInfoAsync).toHaveBeenCalledTimes(2));
  });

  it('a load queued before new keys were saved is sent with the new keys', async () => {
    let release: () => void = () => undefined;
    // the first load answers funding at once, then keeps going with the other sections
    api.getUserInfoAsync.mockImplementationOnce((_k, _s, _c, _d, _sections, onSection: OnSection) => {
      onSection('funding', new AccountInfo());
      return new Promise<void>((r) => { release = r; });
    });
    const storage = device();
    const { result, rerender } = render(storage, { key: 'old-key', secret: 'old-secret' });
    await waitFor(() => expect(api.getUserInfoAsync).toHaveBeenCalledTimes(1));

    api.getUserInfoAsync.mockImplementation(answering());
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000);
    try {
      let queued: Promise<void> = Promise.resolve();
      act(() => { queued = result.current.refreshBinance(['funding']); });   // queued behind the first
      rerender({ key: 'new-key', secret: 'new-secret' });
      await act(async () => { release(); await queued; });
      const second = api.getUserInfoAsync.mock.calls[1];
      expect([second[0], second[1]]).toEqual(['new-key', 'new-secret']);
    } finally {
      vi.restoreAllMocks();
    }
  });
});

describe('Binance in the demo', () => {
  it('one sample portfolio per demo session: polls, refreshes and the market list arriving keep it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval'] });
    try {
      const storage = device();
      const { result, rerender } = renderHook(({ demo }) => {
        const tracker = useRefreshTracker();
        return { tracker, ...BinanceLoader(demo, false, storage, storage, false, null, null, tracker) };
      }, { initialProps: { demo: true } });
      await act(async () => { await vi.advanceTimersByTimeAsync(100); });
      const first = result.current.binanceUserData?.account?.balances?.map((a) => a.id);
      expect(first?.length).toBeGreaterThan(0);

      await act(async () => { await vi.advanceTimersByTimeAsync(5 * 60_000); });           // polls
      await act(async () => {
        const refreshing = result.current.refreshBinance();
        await vi.advanceTimersByTimeAsync(1_000);
        await refreshing;
      });
      rerender({ demo: true });
      expect(result.current.binanceUserData?.account?.balances?.map((a) => a.id)).toEqual(first);
      expect(api.getUserInfoAsync).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('nothing demo is generated outside a demo session', async () => {
    const storage = device();
    const { result } = renderHook(() => {
      const tracker = useRefreshTracker();
      return { tracker, ...BinanceLoader(false, false, storage, storage, false, null, null, tracker) };
    });
    await act(async () => { await Promise.resolve(); });
    expect(result.current.binanceUserData).toBeNull();
  });
});

