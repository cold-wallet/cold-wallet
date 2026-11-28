// RefreshButton — the refresh icon of the header, a source group or a holding. It spins while what
// it covers is loading (automatic polls included) or waiting for a retry, finishing its current
// turn instead of stopping mid-rotation. Amber: a part failed and is retried; red: a part won't load
// until something changes (the tooltip says what). While a rate limit holds the next request it is
// disabled, with a countdown in the tooltip, and comes back on its own when the wait is over.
import React, { useEffect, useState } from 'react';
import type { ButtonView } from '../../refresh/describe';

/** one turn of the icon (the CSS animation duration) */
const SPIN_TURN_MS = 800;

interface RefreshButtonProps {
  /** the view at a given moment (called again every second while a countdown runs) */
  view: (now: number) => ButtonView;
  onClick: () => void;
  className: string;
  label: string;
}

export default function RefreshButton({ view, onClick, className, label }: RefreshButtonProps) {
  const now = Date.now();
  const v = view(now);
  const blocked = v.blockedUntil > now;
  const counting = blocked || v.tone === 'warn';

  // re-render every second while a countdown shows (rate limit, next retry)
  const [, tick] = useState(0);
  useEffect(() => {
    if (!counting) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [counting]);

  // keep turning until the current rotation ends, so a short refresh doesn't jerk to a stop
  // (a hidden or paused icon never ends its turn, so a timer of one turn stops it anyway)
  const [turning, setTurning] = useState(v.spinning);
  useEffect(() => {
    if (v.spinning) { setTurning(true); return; }
    const t = setTimeout(() => setTurning(false), SPIN_TURN_MS);
    return () => clearTimeout(t);
  }, [v.spinning]);
  const onIteration = () => { if (!v.spinning) setTurning(false); };

  const cls = className
    + (turning ? ' spinning' : '')
    + (v.tone === 'warn' ? ' is-warn' : v.tone === 'error' ? ' is-error' : '');
  return (
    <button
      type="button"
      className={cls}
      title={v.title}
      aria-label={label}
      aria-busy={v.spinning}
      disabled={blocked}
      onClick={(e) => { e.stopPropagation(); if (!blocked) onClick(); }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" onAnimationIteration={onIteration}>
        <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
      </svg>
    </button>
  );
}
