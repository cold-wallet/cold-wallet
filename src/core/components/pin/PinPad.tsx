// redesign/PinPad.tsx — reusable PIN keypad (new look) wired to the same
// pinCode / setPinCode / acceptPinCode interface the legacy PinCode used.
import React from 'react';

export const PIN_MIN = 4;
export const PIN_MAX = 8;

interface PinPadProps {
  pinCode: string | null;
  setPinCode: (v: string | null) => void;
  acceptPinCode: () => void;
}

export default function PinPad({ pinCode, setPinCode, acceptPinCode }: PinPadProps) {
  const len = pinCode?.length || 0;
  const press = (d: string) => { if (len < PIN_MAX) setPinCode((pinCode || '') + d); };
  const back = () => { if (len) setPinCode(pinCode!.slice(0, -1) || null); };

  return (
    <>
      <div className="pin-dots">
        {Array.from({ length: PIN_MAX }).map((_, i) => (
          <span key={i} className={'pin-dot' + (i < len ? ' full' : i < PIN_MIN ? ' req' : '')} />
        ))}
      </div>
      <div className="keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} className="key" onClick={() => press(d)}>{d}</button>
        ))}
        <button className="key key--ok" disabled={len < PIN_MIN} onClick={acceptPinCode} title="Confirm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12l5 5L20 6" /></svg>
        </button>
        <button className="key" onClick={() => press('0')}>0</button>
        <button className="key key--muted" onClick={back} title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 4H8L2 12l6 8h13a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zM18 9l-6 6M12 9l6 6" /></svg>
        </button>
      </div>
    </>
  );
}
