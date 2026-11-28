// Vault — the full-screen lock: two doors that meet in the middle, with the Cold Wallet shield split
// across the seam, and the PIN card on top. While the PIN is checked the card steps aside and the
// snowflake on the shield turns like a vault wheel; a right PIN turns it home and the doors slide
// apart over the dashboard. Locking plays the same in reverse. Only transform and opacity animate.
import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import VaultEmblem from './VaultEmblem';
import { vaultMotion, vaultTimings, type VaultPhase } from './useVault';

/** one full turn of the wheel while the PIN is checked */
const SPIN_MS = 1200;
/** a check taking longer than this says so in words under the shield */
const SLOW_CHECK_MS = 1500;

function angleOf(el: SVGGElement): number {
    const m = getComputedStyle(el).transform;
    if (!m || m === 'none') return 0;
    const [a, b] = m.slice(m.indexOf('(') + 1).split(',').map(Number);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
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
    // every animation started on the wheels, so they can be stopped without getAnimations()
    const running = useRef<Animation[]>([]);

    // The wheel: spins while checking, turns home on a right PIN, turns back when the doors lock.
    // Nothing turns with reduced motion.
    useEffect(() => {
        const els = wheels.map((w) => w.current).filter((el): el is SVGGElement => !!el && typeof el.animate === 'function');
        const stop = () => { running.current.forEach((a) => a.cancel()); running.current = []; };
        const play = (frames: Keyframe[], options: KeyframeAnimationOptions) => {
            running.current.push(...els.map((el) => el.animate(frames, options)));
        };
        if (phase === 'shut') { stop(); return; }
        if (!els.length || !vaultMotion()) return;
        const t = vaultTimings();
        if (phase === 'checking') {
            stop();
            play([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
                { duration: SPIN_MS, iterations: Infinity, easing: 'linear' });
        } else if (phase === 'turning') {
            const from = angleOf(els[0]);
            stop();
            const to = (Math.floor(from / 60) + 1) * 60; // on to the next spoke
            play([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }],
                { duration: t.turn, easing: 'cubic-bezier(.2,.9,.3,1.15)', fill: 'forwards' });
        } else if (phase === 'latching') {
            stop();
            play([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-60deg)' }],
                { duration: t.latch, easing: 'cubic-bezier(.2,.9,.3,1.15)', fill: 'forwards' });
        }
    }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

    // A slow check (a slow phone, or the browser struggling) says what is going on.
    const [slow, setSlow] = useState(false);
    useEffect(() => {
        setSlow(false);
        if (phase !== 'checking') return;
        const timer = window.setTimeout(() => setSlow(true), SLOW_CHECK_MS);
        return () => window.clearTimeout(timer);
    }, [phase]);

    const skippable = phase === 'turning' || phase === 'opening';
    useEffect(() => {
        if (!skippable) return;
        const onKey = () => onSkip();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [skippable, onSkip]);

    const t = vaultTimings();
    return (
        <div className="vault" data-phase={phase} onPointerDown={skippable ? onSkip : undefined}
             style={{ '--vault-open': `${t.open}ms`, '--vault-close': `${t.close}ms` } as React.CSSProperties}>
            <div className="vault__door vault__door--l">
                <VaultEmblem className="vault__emblem" ref={wheels[0]} />
            </div>
            <div className="vault__door vault__door--r">
                <VaultEmblem className="vault__emblem" ref={wheels[1]} />
            </div>
            {/* the PIN card's own status line announces it */}
            {slow && phase === 'checking' && <p className="vault__caption" aria-hidden="true">Unlocking…</p>}
            {children && <div className="vault__card">{children}</div>}
            <p className="sr-only" role="status">
                {/* "Unlocking…" is announced by the PIN card itself */}
                {phase === 'turning' || phase === 'opening' ? 'Unlocked' : ''}
            </p>
        </div>
    );
}
