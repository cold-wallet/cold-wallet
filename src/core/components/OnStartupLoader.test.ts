import { act, renderHook } from '@testing-library/react';
import OnStartupLoader, { MarketSources, SYNC_GIVE_UP, SYNC_SCREEN_MAX } from './OnStartupLoader';

const nothingYet: MarketSources = {
  binancePricesLoaded: false, binanceCurrenciesLoaded: false,
  okxPricesLoaded: false, okxCurrenciesLoaded: false,
  monobankRatesFresh: false, pricesMissing: true, dashboardOpen: true,
};
const allFresh: MarketSources = {
  ...nothingYet,
  binancePricesLoaded: true, binanceCurrenciesLoaded: true,
  okxPricesLoaded: true, okxCurrenciesLoaded: true, monobankRatesFresh: true,
};
const hook = (initialProps: MarketSources) => renderHook((s: MarketSources) => OnStartupLoader(s), { initialProps });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('the market-data screen', () => {
  it('waits while holdings have no price, but not longer than its limit', () => {
    const { result } = hook(nothingYet);
    expect(result.current.loaded).toBe(false);
    act(() => { vi.advanceTimersByTime(SYNC_SCREEN_MAX); });
    expect(result.current.loaded).toBe(true);
    expect(result.current.syncing).toBe(true);
  });

  it('is skipped when every holding already has a price (saved, or from one source)', () => {
    const { result } = hook({ ...nothingYet, pricesMissing: false });
    expect(result.current).toEqual({ loaded: true, syncing: true, stale: false });
  });

  it('gives way as soon as every source answered', () => {
    const { result, rerender } = hook(nothingYet);
    rerender(allFresh);
    expect(result.current).toEqual({ loaded: true, syncing: false, stale: false });
  });

  it('gives way as soon as the missing prices arrive, before every source answered', () => {
    const { result, rerender } = hook(nothingYet);
    rerender({ ...nothingYet, pricesMissing: false });
    expect(result.current.loaded).toBe(true);
  });

  it('starts counting only when the dashboard opens: a PIN screen does not use up its time', () => {
    const { result, rerender } = hook({ ...nothingYet, dashboardOpen: false });
    act(() => { vi.advanceTimersByTime(SYNC_SCREEN_MAX * 3); });
    rerender(nothingYet);
    expect(result.current.loaded).toBe(false);
    act(() => { vi.advanceTimersByTime(SYNC_SCREEN_MAX); });
    expect(result.current.loaded).toBe(true);
  });

  it('does not come back once the dashboard was shown', () => {
    const { result, rerender } = hook({ ...nothingYet, pricesMissing: false });
    rerender(nothingYet); // the first holding was just added, its price still on the way
    expect(result.current.loaded).toBe(true);
  });
});

describe('price freshness', () => {
  it('says prices may be outdated once a source stays silent for a minute', () => {
    const { result, rerender } = hook({ ...allFresh, monobankRatesFresh: false, pricesMissing: false });
    expect(result.current).toMatchObject({ syncing: true, stale: false });
    act(() => { vi.advanceTimersByTime(SYNC_GIVE_UP); });
    expect(result.current).toMatchObject({ syncing: false, stale: true });
    rerender({ ...allFresh, pricesMissing: false }); // it answers after all
    expect(result.current).toMatchObject({ syncing: false, stale: false });
  });
});
