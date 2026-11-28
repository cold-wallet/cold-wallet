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

export const VAULT_TIMINGS: VaultTimings = { checkMin: 500, turn: 300, open: 450, close: 340, latch: 260 };
let timings: VaultTimings = VAULT_TIMINGS;

/** Tests only: how long each step takes (0 everywhere: no animation). */
export function setVaultTimingsForTests(t: VaultTimings) {
    timings = t;
}

function animated(): boolean {
    if (timings.open === 0) return false;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
    return !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
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

    // Follow locks and unlocks the doors didn't start, and locks that cut an animation short.
    useEffect(() => {
        if (locked && phase !== 'shut' && phase !== 'checking') { clearTimers(); setPhase('shut'); }
        else if (!locked && phase === 'shut') setPhase('open');
    }, [locked, phase, setPhase]);

    const latest = useRef({ unlock, lock });
    latest.current = { unlock, lock };

    const openDoors = useCallback(async (pin: string): Promise<boolean> => {
        const motion = animated();
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

    const closeDoors = useCallback((reason: R) => {
        const p = current.current;
        if (p === 'closing' || p === 'latching') return;
        if (p !== 'open' || !animated()) { clearTimers(); latest.current.lock(reason); return; }
        setPhase('closing');
        after(timings.close, () => {
            setPhase('latching');
            after(timings.latch, () => { latest.current.lock(reason); setPhase('shut'); });
        });
    }, [setPhase]);

    /** A click or key while the doors open: show the dashboard at once. */
    const skip = useCallback(() => {
        if (current.current === 'turning' || current.current === 'opening') { clearTimers(); setPhase('open'); }
    }, [setPhase]);

    return { phase, unlock: openDoors, lock: closeDoors, skip };
}
