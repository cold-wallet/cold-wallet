// Vault — the full-screen lock: two doors that meet in the middle, with the Cold Wallet shield split
// across the seam, and the PIN card on top. While the PIN is checked the card steps aside and the
// snowflake on the shield turns like a vault wheel; a right PIN turns it home and the doors slide
// apart over the dashboard. Locking plays the same in reverse. Only transform and opacity animate.
import React, { useEffect, useRef, type ReactNode } from 'react';
import VaultEmblem from './VaultEmblem';
import { VAULT_TIMINGS, type VaultPhase } from './useVault';

/** one full turn of the wheel while the PIN is checked */
const SPIN_MS = 2400;

function angleOf(el: SVGGElement): number {
    const m = getComputedStyle(el).transform;
    if (!m || m === 'none') return 0;
    const [a, b] = m.slice(m.indexOf('(') + 1).split(',').map(Number);
    const deg = (Math.atan2(b, a) * 180) / Math.PI;
    return deg < 0 ? deg + 360 : deg;
}

export default function Vault({ phase, onSkip, children }: {
    phase: VaultPhase;
    /** a click or key while the doors open */
    onSkip: () => void;
    /** the PIN card, while the wallet is locked */
    children?: ReactNode;
}) {
    const wheels = [useRef<SVGGElement>(null), useRef<SVGGElement>(null)];
    const spins = useRef<Animation[]>([]);

    // The wheel: spins while checking, turns home on a right PIN, turns back when the doors lock.
    useEffect(() => {
        const els = wheels.map((w) => w.current).filter((el): el is SVGGElement => !!el && typeof el.animate === 'function');
        if (!els.length) return;
        const stopSpin = () => { spins.current.forEach((a) => a.cancel()); spins.current = []; };
        if (phase === 'checking') {
            stopSpin();
            spins.current = els.map((el) => el.animate(
                [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
                { duration: SPIN_MS, iterations: Infinity, easing: 'linear' },
            ));
        } else if (phase === 'turning') {
            const from = angleOf(els[0]);
            stopSpin();
            const to = (Math.ceil(from / 60) + 1) * 60; // the next spoke but one: a deliberate turn
            els.forEach((el) => el.animate(
                [{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }],
                { duration: VAULT_TIMINGS.turn, easing: 'cubic-bezier(.2,.9,.3,1.15)', fill: 'forwards' },
            ));
        } else if (phase === 'latching') {
            els.forEach((el) => el.animate(
                [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-60deg)' }],
                { duration: VAULT_TIMINGS.latch, easing: 'cubic-bezier(.2,.9,.3,1.15)', fill: 'forwards' },
            ));
        } else if (phase === 'shut') {
            stopSpin();
            els.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
        }
    }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

    const skippable = phase === 'turning' || phase === 'opening';
    useEffect(() => {
        if (!skippable) return;
        const onKey = () => onSkip();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [skippable, onSkip]);

    return (
        <div className="vault" data-phase={phase} onPointerDown={skippable ? onSkip : undefined}
             style={{ '--vault-open': `${VAULT_TIMINGS.open}ms`, '--vault-close': `${VAULT_TIMINGS.close}ms` } as React.CSSProperties}>
            <div className="vault__door vault__door--l">
                <VaultEmblem className="vault__emblem" ref={wheels[0]} />
            </div>
            <div className="vault__door vault__door--r">
                <VaultEmblem className="vault__emblem" ref={wheels[1]} />
            </div>
            {children && <div className="vault__card">{children}</div>}
            <p className="sr-only" role="status">
                {/* "Unlocking…" is announced by the PIN card itself */}
                {phase === 'turning' || phase === 'opening' ? 'Unlocked' : ''}
            </p>
        </div>
    );
}
