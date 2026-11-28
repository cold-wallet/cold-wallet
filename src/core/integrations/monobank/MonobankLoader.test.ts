import { act, renderHook } from '@testing-library/react';
import MonobankLoader from './MonobankLoader';
import useRefreshTracker from '../../refresh/useRefreshTracker';
import { activeUnder, stateOf } from '../../refresh/refreshState';
import { sourceView } from '../../refresh/describe';
import inMemoryStorageFactory from '../../../web/storage/InMemoryStorageFactory';
import ApiResponse from '../../domain/ApiResponse';

const { api } = vi.hoisted(() => ({ api: { getUserInfo: vi.fn(), fetchMonobankRatesAndCurrencies: vi.fn() } }));
vi.mock('./monobankApiClient', () => ({ default: api }));

const accounts = { clientId: 'c', name: 'n', webHookUrl: '', permissions: '', accounts: [], jars: [] };

function render(enabled = true, demo = false) {
  return renderHook(() => {
    const tracker = useRefreshTracker();
    const loader = MonobankLoader(demo, !demo, inMemoryStorageFactory, inMemoryStorageFactory, enabled, enabled ? 'test-token' : null, tracker);
    return { tracker, ...loader };
  });
}

let now = 1_000_000;
beforeEach(() => {
  now = 1_000_000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  api.getUserInfo.mockReset().mockResolvedValue(ApiResponse.success(200, accounts));
  api.fetchMonobankRatesAndCurrencies.mockReset().mockResolvedValue(ApiResponse.fail(0, 'not under test'));
});
afterEach(() => vi.restoreAllMocks());

describe('Monobank refresh: one request a minute', () => {
  it('a click right after the automatic load is answered from it, without a request', async () => {
    const { result } = render();
    await act(async () => { await Promise.resolve(); });
    expect(api.getUserInfo).toHaveBeenCalledTimes(1);

    now += 20_000;
    await act(async () => { await result.current.refreshMonobank(); });
    expect(api.getUserInfo).toHaveBeenCalledTimes(1);
  });

  it('after a manual refresh the button waits out the minute, then loads again', async () => {
    const { result } = render();
    await act(async () => { await Promise.resolve(); });
    now += 61_000;
    await act(async () => { await result.current.refreshMonobank(); });
    expect(api.getUserInfo).toHaveBeenCalledTimes(2);

    now += 30_000;
    expect(sourceView(result.current.tracker.status, 'monobank', now).blockedUntil).toBe(now + 30_000);
    await act(async () => { await result.current.refreshMonobank(); });
    expect(api.getUserInfo).toHaveBeenCalledTimes(2);

    now += 30_000;
    expect(sourceView(result.current.tracker.status, 'monobank', now).blockedUntil).toBe(0);
    await act(async () => { await result.current.refreshMonobank(); });
    expect(api.getUserInfo).toHaveBeenCalledTimes(3);
  });

  it('a rejected token stops the button (no retry); a rate limit keeps it spinning for a retry', async () => {
    api.getUserInfo.mockResolvedValueOnce(ApiResponse.fail(403, 'Unknown token'));
    const { result } = render();
    await act(async () => { await Promise.resolve(); });
    expect(stateOf(result.current.tracker.status, 'monobank').error?.kind).toBe('fatal');
    expect(activeUnder(result.current.tracker.status, 'monobank')).toBe(false);

    api.getUserInfo.mockResolvedValueOnce(ApiResponse.fail(429, 'Too many requests'));
    now += 61_000;
    await act(async () => { await result.current.refreshMonobank(); });
    expect(stateOf(result.current.tracker.status, 'monobank').error?.kind).toBe('retry');
    expect(activeUnder(result.current.tracker.status, 'monobank')).toBe(true);
  });

  it('nothing loads for a switched-off integration', async () => {
    const { result } = render(false);
    await act(async () => { await result.current.refreshMonobank(); });
    expect(api.getUserInfo).not.toHaveBeenCalled();
    // (the public exchange rates still load: they need no account)
    expect(Object.keys(result.current.tracker.status)).toEqual(['prices/monobank']);
  });

  it('demo mode: the button spins briefly, nothing is requested', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    try {
      const { result } = render(true, true);
      let done: Promise<void> = Promise.resolve();
      act(() => { done = result.current.refreshMonobank(); });
      await act(async () => { await Promise.resolve(); });
      expect(activeUnder(result.current.tracker.status, 'monobank')).toBe(true);
      await act(async () => { vi.advanceTimersByTime(1_000); await done; });
      expect(activeUnder(result.current.tracker.status, 'monobank')).toBe(false);
      expect(api.getUserInfo).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
