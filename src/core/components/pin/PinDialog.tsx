// components/pin/PinDialog.tsx — the one look for every PIN screen (new wallet, wallet without a PIN,
// unlock, change PIN): a compact dialog with an optional Back / step row, a centred title, a short
// explanation, a status line, the keypad, and an optional footer (warning, "forgot PIN" link).
import React, { useEffect, useRef, type ReactNode } from 'react';
import PinPad from './PinPad';

interface PinDialogProps {
  title: string;
  intro?: ReactNode;
  /** the current instruction or error, announced to screen readers */
  status?: ReactNode;
  statusError?: boolean;
  /** e.g. "Step 1 of 2" */
  step?: string;
  onBack?: () => void;
  pin: string | null;
  setPin: (v: string | null) => void;
  onAccept: () => void;
  footer?: ReactNode;
  /** the PIN is being checked: the keypad is paused */
  busy?: boolean;
}

export default function PinDialog({ title, intro, status, statusError, step, onBack, pin, setPin, onAccept, footer, busy = false }: PinDialogProps) {
  // Take focus when opened, so typed digits reach the keypad and not a field left focused underneath
  // (e.g. the import token textarea).
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.focus(); }, []);
  return (
    <div className="scrim" style={{ zIndex: 80 }}>
      <div className="dialog pin-dialog" ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}>
        {(onBack || step) && (
          <div className="pin-dialog__head">
            {onBack && (
              <button className="backbtn" onClick={onBack} disabled={busy}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 6l-6 6 6 6" /></svg>
                Back
              </button>
            )}
            {step && <span className="pin-dialog__step">{step}</span>}
          </div>
        )}
        <div className="pin-dialog__title">
          <span className="pin-dialog__chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          </span>
          <b>{title}</b>
        </div>
        {intro && <p className="pin-dialog__intro">{intro}</p>}
        {status && <p className={'pin-dialog__status' + (statusError ? ' is-error' : '')} role="status">{status}</p>}
        <PinPad pinCode={pin} setPinCode={setPin} acceptPinCode={onAccept} disabled={busy} />
        {footer}
      </div>
    </div>
  );
}

/** Shown when the browser itself fails (e.g. not enough memory to derive the key) — never as a
 *  "wrong PIN", so nobody gives up a wallet over a browser problem. */
export const BROWSER_PIN_ERROR = "This browser couldn't check the PIN (it may be short on memory). Nothing was changed. Try again, or open the wallet in another browser.";

/** The warning every "choose a PIN" step carries. */
export function ForgetPinWarning() {
  return (
    <p className="pin-dialog__warn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
      If you forget this PIN, access to this wallet is lost forever. There is no way to reset it.
    </p>
  );
}
