import { act, renderHook } from '@testing-library/react';
import OnStartupLoader, { MarketSources, SYNC_GIVE_UP, SYNC_SCREEN_MAX } from './OnStartupLoader';

const nothingYet: MarketSources = {
  binancePricesLoaded: false, binanceCurrenciesLoaded: false,
  okxPricesLoaded: false, okxCurrenciesLoaded: false,
  monobankRatesFresh: false, savedPricesAvailable: false, anyAssetExist: true, walletOpen: true,
};
const allFresh: MarketSources = {
  ...nothingYet,
  binancePricesLoaded: true, binanceCurrenciesLoaded: true,
  okxPricesLoaded: true, okxCurrenciesLoaded: true, monobankRatesFresh: true,
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('the market-data screen', () => {
  it('waits on a first launch with holdings, but not longer than its limit', () => {
    const { result } = renderHook(() => OnStartupLoader(nothingYet));
    expect(result.current.loaded).toBe(false);
    act(() => { vi.advanceTimersByTime(SYNC_SCREEN_MAX); });
    expect(result.current.loaded).toBe(true);
    expect(result.current.syncing).toBe(true);
  });

  it('is skipped with prices saved on an earlier visit, which refresh quietly', () => {
    const { result } = renderHook(() => OnStartupLoader({ ...nothingYet, savedPricesAvailable: true }));
    expect(result.current).toEqual({ loaded: true, syncing: true });
  });

  it('is skipped when there is nothing to price', () => {
    const { result } = renderHook(() => OnStartupLoader({ ...nothingYet, anyAssetExist: false }));
    expect(result.current.loaded).toBe(true);
  });

  it('gives way as soon as every source answered', () => {
    const { result, rerender } = renderHook((s: MarketSources) => OnStartupLoader(s), { initialProps: nothingYet });
    rerender(allFresh);
    expect(result.current).toEqual({ loaded: true, syncing: false });
  });

  it('waits for the wallet to open: a PIN screen or start screen does not use up its time', () => {
    const { result, rerender } = renderHook((s: MarketSources) => OnStartupLoader(s), { initialProps: { ...nothingYet, walletOpen: false, anyAssetExist: false } });
    act(() => { vi.advanceTimersByTime(SYNC_SCREEN_MAX * 3); });
    rerender(nothingYet); // unlocked: holdings, no prices on this device yet
    expect(result.current.loaded).toBe(false);
    act(() => { vi.advanceTimersByTime(SYNC_SCREEN_MAX); });
    expect(result.current.loaded).toBe(true);
  });

  it('does not come back once the dashboard was shown', () => {
    const { result, rerender } = renderHook((s: MarketSources) => OnStartupLoader(s), { initialProps: { ...nothingYet, anyAssetExist: false } });
    rerender(nothingYet); // the first holding was just added, prices still on the way
    expect(result.current.loaded).toBe(true);
  });

  it('stops saying prices are loading after a minute of a source not answering', () => {
    const { result } = renderHook(() => OnStartupLoader({ ...allFresh, monobankRatesFresh: false }));
    expect(result.current.syncing).toBe(true);
    act(() => { vi.advanceTimersByTime(SYNC_GIVE_UP); });
    expect(result.current.syncing).toBe(false);
  });
});
