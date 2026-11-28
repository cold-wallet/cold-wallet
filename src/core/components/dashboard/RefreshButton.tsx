// RefreshButton — the refresh icon of the header, a source group or a holding. It spins while what
// it covers is loading (automatic polls included) or waiting for a retry, finishing its current
// turn instead of stopping mid-rotation. Amber: a part failed and is retried; red: a part won't load
// until something changes (the tooltip says what). While a rate limit holds the next request the
// icon dims and a click does nothing; how long is left ("in 25s") shows only where it answers a
// question: on hover, and for a few seconds after a click or tap (touch screens have no hover).
import React, { useEffect, useState } from 'react';
import type { ButtonView } from '../../refresh/describe';
import type { RefreshStatus } from '../../refresh/refreshState';
import { RefreshStore, useRefreshStatus } from '../../refresh/useRefreshTracker';

/** one turn of the icon (the CSS animation duration) */
const SPIN_TURN_MS = 800;
/** how long the wait shows after a click on a button that has to wait */
const WAIT_NOTICE_MS = 3_000;

interface RefreshButtonProps {
  /** the refresh status it shows (read here, so a change re-renders only the button) */
  store: RefreshStore;
  /** the view of that status at a given moment (called again every second while a countdown runs) */
  view: (status: RefreshStatus, now: number) => ButtonView;
  onClick: () => void;
  className: string;
  label: string;
}

export default function RefreshButton({ store, view, onClick, className, label }: RefreshButtonProps) {
  const status = useRefreshStatus(store);
  const now = Date.now();
  const v = view(status, now);
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

  // a click while it has to wait: say how long, for a moment
  const [notice, setNotice] = useState(false);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(false), WAIT_NOTICE_MS);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => { if (!blocked) setNotice(false); }, [blocked]);

  const cls = className
    + (turning ? ' spinning' : '')
    + (v.tone === 'warn' ? ' is-warn' : v.tone === 'error' ? ' is-error' : '')
    + (blocked ? ' is-waiting' : '')
    + (blocked && notice ? ' show-wait' : '');
  return (
    <button
      type="button"
      className={cls}
      title={v.title}
      aria-label={label}
      aria-busy={v.spinning}
      aria-disabled={blocked || undefined}
      onClick={(e) => { e.stopPropagation(); if (blocked) setNotice(true); else onClick(); }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" onAnimationIteration={onIteration}>
        <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
      </svg>
      {blocked && (
        <span className="refresh__wait" role="status">in {Math.max(1, Math.ceil((v.blockedUntil - now) / 1000))}s</span>
      )}
    </button>
  );
}
