// useIdleLock — calls `onIdle` once nothing has happened (no pointer, key, touch, wheel or scroll
// input) for `ms` while `active`. Also checked when the tab becomes visible again, since timers in
// background tabs are throttled.
import { useEffect, useRef } from 'react';

export const AUTO_LOCK_AFTER = 5 * 60_000;

const EVENTS = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel', 'scroll'] as const;

export default function useIdleLock(active: boolean, onIdle: () => void, ms: number = AUTO_LOCK_AFTER) {
    const latest = useRef(onIdle);
    latest.current = onIdle;

    useEffect(() => {
        if (!active) return;
        let last = Date.now();
        const touch = () => { last = Date.now(); };
        const check = () => {
            if (Date.now() - last >= ms) latest.current();
        };
        const onVisible = () => { if (document.visibilityState === 'visible') check(); };
        EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true, capture: true }));
        document.addEventListener('visibilitychange', onVisible);
        const timer = window.setInterval(check, Math.min(10_000, ms));
        return () => {
            EVENTS.forEach((e) => window.removeEventListener(e, touch, { capture: true }));
            document.removeEventListener('visibilitychange', onVisible);
            window.clearInterval(timer);
        };
    }, [active, ms]);
}
