// components/pin/PinPad.tsx — reusable PIN keypad (new look) wired to the same
// pinCode / setPinCode / acceptPinCode interface the legacy PinCode used.
// Works from the keyboard too: digits (top row or numpad), Backspace / Delete, Enter.
import React, { useEffect, useRef, useState } from 'react';

export const PIN_MIN = 4;
export const PIN_MAX = 8;

interface PinPadProps {
  pinCode: string | null;
  setPinCode: (v: string | null) => void;
  acceptPinCode: () => void;
  /** ignore input (e.g. while the PIN is being checked) */
  disabled?: boolean;
}

const BACK = 'back';
const OK = 'ok';

export default function PinPad({ pinCode, setPinCode, acceptPinCode, disabled = false }: PinPadProps) {
  const len = pinCode?.length || 0;
  const press = (d: string) => { if (!disabled && len < PIN_MAX) setPinCode((pinCode || '') + d); };
  const back = () => { if (!disabled && len) setPinCode(pinCode!.slice(0, -1) || null); };
  const accept = () => { if (!disabled && len >= PIN_MIN) acceptPinCode(); };

  // The key last hit on the keyboard, lit up briefly so typing gives the same feedback as a tap.
  const [lit, setLit] = useState<string | null>(null);
  const litTimer = useRef<number | undefined>(undefined);

  // The listener is registered once; it reads the current handlers through a ref.
  const latest = useRef({ press, back, accept });
  latest.current = { press, back, accept };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      let key: string | null = null;
      if (/^[0-9]$/.test(e.key)) { key = e.key; latest.current.press(e.key); }
      else if (e.key === 'Backspace' || e.key === 'Delete') { key = BACK; latest.current.back(); }
      else if (e.key === 'Enter') { key = OK; latest.current.accept(); }
      if (key === null) return;
      // Stop Enter from also "clicking" a keypad button that has focus after a mouse tap.
      e.preventDefault();
      setLit(key);
      window.clearTimeout(litTimer.current);
      litTimer.current = window.setTimeout(() => setLit(null), 140);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(litTimer.current);
    };
  }, []);

  const cls = (base: string, id: string) => base + (lit === id ? ' is-pressed' : '');

  return (
    <>
      <div className="pin-dots" aria-label={`${len} of ${PIN_MAX} digits entered`}>
        {Array.from({ length: PIN_MAX }).map((_, i) => (
          <span key={i} className={'pin-dot' + (i < len ? ' full' : i < PIN_MIN ? ' req' : '')} />
        ))}
      </div>
      <div className={'keypad' + (disabled ? ' is-busy' : '')} aria-busy={disabled}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} className={cls('key', d)} disabled={disabled} onClick={() => press(d)}>{d}</button>
        ))}
        <button className={cls('key key--ok', OK)} disabled={disabled || len < PIN_MIN} onClick={accept} title="Confirm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12l5 5L20 6" /></svg>
        </button>
        <button className={cls('key', '0')} disabled={disabled} onClick={() => press('0')}>0</button>
        <button className={cls('key key--muted', BACK)} disabled={disabled} onClick={back} title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 4H8L2 12l6 8h13a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zM18 9l-6 6M12 9l6 6" /></svg>
        </button>
      </div>
    </>
  );
}
