// useVault — the lock screen's doors: in which phase they are, and unlock / lock calls that play
// the doors' animation around the real unlock and lock.
//
//   shut ──unlock──▶ checking ──right PIN──▶ turning ──▶ opening ──▶ open
//     ▲                 └──wrong PIN──▶ shut                          │
//     └────────── latching ◀── closing ◀────────────lock──────────────┘
//
// The wallet opens as soon as the PIN is right (the dashboard mounts behind the closed doors); the
// doors then take a moment to open. A lock closes the doors first and locks the wallet once they
// have shut. Locks and unlocks made elsewhere (another tab, a new or imported wallet) jump straight
// to the matching phase. Without motion (reduced-motion setting, hidden tab, tests) everything is
// immediate.
import { useCallback, useEffect, useRef, useState } from 'react';

export type VaultPhase = 'shut' | 'checking' | 'turning' | 'opening' | 'open' | 'closing' | 'latching';

/** Milliseconds for each animated step. */
export interface VaultTimings {
    /** the shortest "checking" the eye can follow, even when the PIN is checked faster */
    checkMin: number;
    /** the wheel turns home */
    turn: number;
    /** the doors slide apart */
    open: number;
    /** the doors slide together */
    close: number;
    /** the wheel turns back */
    latch: number;
}

export const VAULT_TIMINGS: VaultTimings = { checkMin: 300, turn: 240, open: 420, close: 320, latch: 220 };
let timings: VaultTimings = VAULT_TIMINGS;

/** Tests only: how long each step takes (0 everywhere: no animation). */
export function setVaultTimingsForTests(t: VaultTimings) {
    timings = t;
}

/** The step durations in use. */
export const vaultTimings = () => timings;

/** Whether the doors animate now: not in tests, not for a hidden tab, not with reduced motion. */
export function vaultMotion(): boolean {
    if (timings.open === 0) return false;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
    return !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

/** The phase to show for `locked`: a lock or unlock made elsewhere wins over the stored phase at
 *  once, so no frame shows doors over an open wallet or nothing over a locked one. */
function shownPhase(phase: VaultPhase, locked: boolean): VaultPhase {
    if (locked && phase !== 'shut' && phase !== 'checking') return 'shut';
    if (!locked && phase === 'shut') return 'open';
    return phase;
}

export default function useVault<R>({ locked, unlock, lock }: {
    /** the wallet is locked (its PIN is asked for) */
    locked: boolean;
    /** resolves false on a wrong PIN */
    unlock: (pin: string) => Promise<boolean>;
    lock: (reason: R) => void;
}) {
    const [phase, setPhaseState] = useState<VaultPhase>(locked ? 'shut' : 'open');
    const current = useRef(phase);
    const setPhase = useCallback((p: VaultPhase) => { current.current = p; setPhaseState(p); }, []);

    const timers = useRef<number[]>([]);
    const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
    const after = (ms: number, run: () => void) => { timers.current.push(window.setTimeout(run, ms)); };
    useEffect(() => clearTimers, []);

    // Store what is shown, so the next step starts from it.
    const shown = shownPhase(phase, locked);
    useEffect(() => {
        if (shown !== phase) { clearTimers(); setPhase(shown); }
    }, [shown, phase, setPhase]);

    const latest = useRef({ unlock, lock });
    latest.current = { unlock, lock };

    const openDoors = useCallback(async (pin: string): Promise<boolean> => {
        const motion = vaultMotion();
        const started = Date.now();
        setPhase('checking');
        let ok: boolean;
        try {
            ok = await latest.current.unlock(pin);
        } catch (e) {
            if (current.current === 'checking') setPhase('shut');
            throw e;
        }
        if (current.current !== 'checking') return ok; // locked again meanwhile
        if (!ok) { setPhase('shut'); return false; }
        if (!motion) { setPhase('open'); return true; }
        after(Math.max(0, timings.checkMin - (Date.now() - started)), () => {
            setPhase('turning');
            after(timings.turn, () => {
                setPhase('opening');
                after(timings.open, () => setPhase('open'));
            });
        });
        return true;
    }, [setPhase]);

    // The reason of a lock waiting for the doors to shut.
    const pending = useRef<{ reason: R } | null>(null);
    const lockNow = useCallback(() => {
        const p = pending.current;
        pending.current = null;
        clearTimers();
        if (p) { latest.current.lock(p.reason); setPhase('shut'); }
    }, [setPhase]);

    /** Lock the wallet; with `animate`, close the doors first. */
    const closeDoors = useCallback((reason: R, animate = true) => {
        const p = current.current;
        if (p === 'closing' || p === 'latching') {
            if (!animate) lockNow();
            return;
        }
        if (!animate || p !== 'open' || !vaultMotion()) { clearTimers(); latest.current.lock(reason); return; }
        pending.current = { reason };
        setPhase('closing');
        after(timings.close, () => {
            setPhase('latching');
            after(timings.latch, lockNow);
        });
    }, [setPhase, lockNow]);

    // A tab hidden while the doors close locks at once: background timers can run late.
    const closingNow = shown === 'closing' || shown === 'latching';
    useEffect(() => {
        if (!closingNow) return;
        const onHidden = () => { if (document.visibilityState === 'hidden') lockNow(); };
        document.addEventListener('visibilitychange', onHidden);
        return () => document.removeEventListener('visibilitychange', onHidden);
    }, [closingNow, lockNow]);

    /** A click or key while the doors open: show the dashboard at once. */
    const skip = useCallback(() => {
        if (current.current === 'turning' || current.current === 'opening') { clearTimers(); setPhase('open'); }
    }, [setPhase]);

    return { phase: shown, unlock: openDoors, lock: closeDoors, skip };
}
