import { act, renderHook } from '@testing-library/react';
import useRefreshTracker, { FRESH_PULSE_MS, useScopedRunner } from './useRefreshTracker';
import { activeUnder, stateOf } from './refreshState';

function setup(serial: boolean) {
  return renderHook(() => {
    const tracker = useRefreshTracker();
    const run = useScopedRunner(tracker, serial);
    return { tracker, run };
  });
}

/** a request that ends when the test says so */
function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((r) => { resolve = r; });
  return { promise, resolve };
}

describe('useScopedRunner', () => {
  it('a second click while a request is on its way joins it instead of sending another', async () => {
    const { result } = setup(true);
    const gate = deferred();
    const work = vi.fn(async (keys: string[], settle) => { await gate.promise; keys.forEach(settle.ok); });

    let first: Promise<void> = Promise.resolve();
    let second: Promise<void> = Promise.resolve();
    act(() => { first = result.current.run(['monobank'], false, work); });
    act(() => { second = result.current.run(['monobank'], true, work); });
    expect(work).toHaveBeenCalledTimes(0); // queued behind nothing, but asynchronous
    await act(async () => { gate.resolve(); await first; await second; });
    expect(work).toHaveBeenCalledTimes(1);
    expect(activeUnder(result.current.tracker.current(), 'monobank')).toBe(false);
  });

  it('a coin of an account already loading joins the account request', async () => {
    const { result } = setup(true);
    const gate = deferred();
    const work = vi.fn(async (keys: string[], settle) => { await gate.promise; keys.forEach(settle.ok); });
    act(() => { void result.current.run(['okx/spot'], false, work); });
    act(() => { void result.current.run(['okx/spot/BTC'], true, work); });
    await act(async () => { gate.resolve(); });
    expect(work).toHaveBeenCalledTimes(1);
    expect(work.mock.calls[0][0]).toEqual(['okx/spot']);
  });

  it('a serial runner sends one request after the other', async () => {
    const { result } = setup(true);
    const order: string[] = [];
    const gate = deferred();
    act(() => {
      void result.current.run(['binance/spot'], false, async (keys, settle) => {
        order.push('spot start'); await gate.promise; order.push('spot end'); keys.forEach(settle.ok);
      });
      void result.current.run(['binance/funding'], true, async (keys, settle) => {
        order.push('funding'); keys.forEach(settle.ok);
      });
    });
    await act(async () => { await Promise.resolve(); });
    expect(order).toEqual(['spot start']);
    await act(async () => { gate.resolve(); });
    expect(order).toEqual(['spot start', 'spot end', 'funding']);
  });

  it('parts the work leaves unreported fail, to be retried', async () => {
    const { result } = setup(false);
    await act(async () => {
      await result.current.run(['ccxt:kraken', 'ccxt:bybit'], false, async (_keys, settle) => { settle.ok('ccxt:kraken'); });
    });
    const status = result.current.tracker.current();
    expect(stateOf(status, 'ccxt:kraken').error).toBeNull();
    expect(stateOf(status, 'ccxt:bybit').error?.kind).toBe('retry');
  });

  it('outcomes that land after a lock are dropped: nothing of the closed wallet spins', async () => {
    const { result } = setup(false);
    const gate = deferred();
    let done: Promise<void> = Promise.resolve();
    act(() => { done = result.current.run(['binance/spot'], false, async (keys, settle) => { await gate.promise; settle.fail('binance/spot', 'x', 'retry'); }); });
    act(() => result.current.tracker.reset());
    await act(async () => { gate.resolve(); await done; });
    expect(result.current.tracker.current()).toEqual({});
  });

  it('a lock keeps the state of market data: a price request on its way still lands', async () => {
    const { result } = setup(false);
    const gate = deferred();
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = result.current.run(['prices/monobank'], false, async (keys, settle) => { await gate.promise; settle.fail('prices/monobank', '429', 'retry'); });
      void result.current.run(['monobank'], false, async () => { await gate.promise; });
    });
    act(() => result.current.tracker.reset());
    expect(Object.keys(result.current.tracker.current())).toEqual(['prices/monobank']);
    await act(async () => { gate.resolve(); await done; });
    expect(stateOf(result.current.tracker.current(), 'prices/monobank').error?.kind).toBe('retry');
    expect(stateOf(result.current.tracker.current(), 'monobank').running).toBe(0);
  });
});

describe('answering from fresh data', () => {
  it('spins briefly without a request', async () => {
    vi.useFakeTimers();
    try {
      const { result } = setup(false);
      act(() => result.current.tracker.pulse(['okx/spot']));
      expect(activeUnder(result.current.tracker.current(), 'okx')).toBe(true);
      act(() => { vi.advanceTimersByTime(FRESH_PULSE_MS); });
      expect(activeUnder(result.current.tracker.current(), 'okx')).toBe(false);
      expect(stateOf(result.current.tracker.current(), 'okx/spot').lastAttemptAt).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
