import { renderHook } from '@testing-library/react';
import useIdleLock from './useIdleLock';

describe('useIdleLock', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('locks after the idle time without input, and input pushes it back', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleLock(true, onIdle, 60_000));
    vi.advanceTimersByTime(50_000);
    window.dispatchEvent(new Event('keydown'));
    vi.advanceTimersByTime(50_000);
    expect(onIdle).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20_000);
    expect(onIdle).toHaveBeenCalled();
  });

  it('does nothing while inactive (locked wallet, demo, no PIN)', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleLock(false, onIdle, 60_000));
    vi.advanceTimersByTime(10 * 60_000);
    expect(onIdle).not.toHaveBeenCalled();
  });
});
