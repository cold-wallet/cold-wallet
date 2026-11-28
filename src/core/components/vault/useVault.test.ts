import { act, renderHook } from '@testing-library/react';
import useVault, { setVaultTimingsForTests, VAULT_TIMINGS } from './useVault';

type Props = { locked: boolean };

function setup(initiallyLocked: boolean, unlockResult: boolean | Error = true) {
  const state = { locked: initiallyLocked };
  const unlock = vi.fn(async () => {
    if (unlockResult instanceof Error) throw unlockResult;
    if (unlockResult) { state.locked = false; hook.rerender({ locked: false }); }
    return unlockResult;
  });
  const lock = vi.fn(() => { state.locked = true; hook.rerender({ locked: true }); });
  const hook = renderHook(({ locked }: Props) => useVault<'manual'>({ locked, unlock, lock }), {
    initialProps: { locked: initiallyLocked },
  });
  return { hook, unlock, lock, phase: () => hook.result.current.phase };
}

const T = VAULT_TIMINGS;

describe('useVault', () => {
  beforeEach(() => {
    setVaultTimingsForTests(VAULT_TIMINGS);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    setVaultTimingsForTests({ checkMin: 0, turn: 0, open: 0, close: 0, latch: 0 });
  });

  it('opens the doors step by step after a right PIN, the wallet opening first', async () => {
    const { hook, phase } = setup(true);
    expect(phase()).toBe('shut');
    await act(async () => { await hook.result.current.unlock('2580'); });
    expect(phase()).toBe('checking'); // held for the shortest visible check
    act(() => { vi.advanceTimersByTime(T.checkMin); });
    expect(phase()).toBe('turning');
    act(() => { vi.advanceTimersByTime(T.turn); });
    expect(phase()).toBe('opening');
    act(() => { vi.advanceTimersByTime(T.open); });
    expect(phase()).toBe('open');
  });

  it('shuts again at once on a wrong PIN', async () => {
    const { hook, phase } = setup(true, false);
    let ok = true;
    await act(async () => { ok = await hook.result.current.unlock('1111'); });
    expect(ok).toBe(false);
    expect(phase()).toBe('shut');
  });

  it('shuts again and passes the error on when the PIN could not be checked', async () => {
    const { hook, phase } = setup(true, new Error('no memory'));
    await act(async () => {
      await expect(hook.result.current.unlock('2580')).rejects.toThrow('no memory');
    });
    expect(phase()).toBe('shut');
  });

  it('closes the doors before locking the wallet', () => {
    const { hook, lock, phase } = setup(false);
    expect(phase()).toBe('open');
    act(() => hook.result.current.lock('manual'));
    expect(phase()).toBe('closing');
    expect(lock).not.toHaveBeenCalled(); // still open under the closing doors
    act(() => { vi.advanceTimersByTime(T.close); });
    expect(phase()).toBe('latching');
    act(() => { vi.advanceTimersByTime(T.latch); });
    expect(lock).toHaveBeenCalledWith('manual');
    expect(phase()).toBe('shut');
  });

  it('locks at once when nobody can see the doors', () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    const { hook, lock, phase } = setup(false);
    act(() => hook.result.current.lock('manual'));
    expect(lock).toHaveBeenCalledTimes(1);
    expect(phase()).toBe('shut');
  });

  it('locks at once without the doors when asked to (an auto-lock)', () => {
    const { hook, lock, phase } = setup(false);
    act(() => hook.result.current.lock('manual', false));
    expect(lock).toHaveBeenCalledTimes(1);
    expect(phase()).toBe('shut');
  });

  it('locks at once when the tab is hidden while the doors close', () => {
    const { hook, lock, phase } = setup(false);
    act(() => hook.result.current.lock('manual'));
    expect(phase()).toBe('closing');
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(lock).toHaveBeenCalledWith('manual');
    expect(phase()).toBe('shut');
    act(() => { vi.advanceTimersByTime(T.close + T.latch); });
    expect(lock).toHaveBeenCalledTimes(1); // the doors' own timers were dropped
  });

  it('shows the dashboard at once when the opening is skipped', async () => {
    const { hook, phase } = setup(true);
    await act(async () => { await hook.result.current.unlock('2580'); });
    act(() => { vi.advanceTimersByTime(T.checkMin); });
    act(() => hook.result.current.skip());
    expect(phase()).toBe('open');
  });

  it('follows locks and unlocks made elsewhere in the same render', () => {
    const seen: string[] = [];
    const lock = vi.fn();
    const hook = renderHook(({ locked }: Props) => {
      const v = useVault<'manual'>({ locked, unlock: async () => true, lock });
      seen.push(`${locked}:${v.phase}`);
      return v;
    }, { initialProps: { locked: false } });
    hook.rerender({ locked: true }); // e.g. the PIN changed in another tab
    expect(hook.result.current.phase).toBe('shut');
    hook.rerender({ locked: false }); // e.g. a new wallet created from the start screen
    expect(hook.result.current.phase).toBe('open');
    // never a render with doors over an open wallet, or none over a locked one
    expect(seen.filter((s) => s === 'true:open' || s === 'false:shut')).toEqual([]);
  });

  it('shuts when the wallet is locked elsewhere while the doors open', async () => {
    const { hook, phase } = setup(true);
    await act(async () => { await hook.result.current.unlock('2580'); });
    act(() => { vi.advanceTimersByTime(T.checkMin + T.turn); });
    expect(phase()).toBe('opening');
    hook.rerender({ locked: true });
    expect(phase()).toBe('shut');
    act(() => { vi.advanceTimersByTime(T.open); });
    expect(phase()).toBe('shut'); // the opening's last step was dropped
  });
});
