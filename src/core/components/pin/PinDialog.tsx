// components/pin/PinDialog.tsx — the one look for every PIN screen (new wallet, wallet without a PIN,
// unlock, change PIN): a compact dialog with an optional Back / step row, a centred title, a short
// explanation, a status line, the keypad, and an optional footer (warning, "forgot PIN" link).
import React, { type ReactNode } from 'react';
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
}

export default function PinDialog({ title, intro, status, statusError, step, onBack, pin, setPin, onAccept, footer }: PinDialogProps) {
  return (
    <div className="scrim" style={{ zIndex: 80 }}>
      <div className="dialog pin-dialog">
        {(onBack || step) && (
          <div className="pin-dialog__head">
            {onBack && (
              <button className="backbtn" onClick={onBack}>
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
        <PinPad pinCode={pin} setPinCode={setPin} acceptPinCode={onAccept} />
        {footer}
      </div>
    </div>
  );
}

/** The warning every "choose a PIN" step carries. */
export function ForgetPinWarning() {
  return (
    <p className="pin-dialog__warn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
      If you forget this PIN, access to this wallet is lost forever. There is no way to reset it.
    </p>
  );
}
