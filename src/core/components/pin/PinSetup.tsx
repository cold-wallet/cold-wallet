// components/pin/PinSetup.tsx — choose a new PIN in two steps: enter it, then enter it again.
// Nothing is saved here: `onDone` gets the PIN only after both entries matched, and the caller
// creates / re-encrypts the wallet then. On a mismatch the flow starts over from the first step,
// since there is no telling which of the two entries had the typo. Used for a new wallet, for a
// wallet that has no PIN yet (old or imported), and for "start a new empty wallet" on the lock screen.
import React, { useState, type ReactNode } from 'react';
import PinPad, { PIN_MAX, PIN_MIN } from './PinPad';

interface PinSetupProps {
  title: string;
  /** shown above the step prompt (why a PIN is being asked for) */
  intro?: ReactNode;
  /** "Back" leaves the flow without saving anything; omitted when there is nowhere to go back to */
  onBack?: () => void;
  onDone: (pin: string) => void;
}

export default function PinSetup({ title, intro, onBack, onDone }: PinSetupProps) {
  const [first, setFirst] = useState<string | null>(null);
  const [entry, setEntry] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const confirming = first !== null;

  function accept() {
    if (!entry || entry.length < PIN_MIN || entry.length > PIN_MAX) return;
    if (!confirming) {
      setFirst(entry);
      setEntry(null);
      setMismatch(false);
    } else if (entry === first) {
      onDone(entry);
    } else {
      setFirst(null);
      setEntry(null);
      setMismatch(true);
    }
  }

  return (
    <div className="scrim" style={{ zIndex: 80 }}>
      <div className="dialog pin-setup" style={{ width: 380 }}>
        <div className="pin-setup__head">
          {onBack && (
            <button className="backbtn" onClick={onBack}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 6l-6 6 6 6" /></svg>
              Back
            </button>
          )}
          <span className="pin-setup__step">Step {confirming ? 2 : 1} of 2</span>
        </div>
        <div className="cfg-title" style={{ justifyContent: 'center', marginBottom: 6 }}>
          <span className="intg__chip" style={{ background: 'var(--accent)', width: 32, height: 32, borderRadius: 9, color: 'var(--accent-ink)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          </span>
          <b>{title}</b>
        </div>
        {intro && <p className="data-desc" style={{ textAlign: 'center', marginBottom: 6 }}>{intro}</p>}
        <p className="data-desc" role="status" style={{ textAlign: 'center', color: mismatch ? 'var(--danger)' : undefined }}>
          {confirming ? 'Enter the same PIN again to confirm it.'
            : mismatch ? "The PINs didn't match. Choose your PIN again."
              : `Choose a ${PIN_MIN}–${PIN_MAX} digit PIN.`}
        </p>
        <PinPad pinCode={entry} setPinCode={setEntry} acceptPinCode={accept} />
        <p className="pin-setup__warn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
          If you forget this PIN, access to this wallet is lost forever. There is no way to reset it.
        </p>
      </div>
    </div>
  );
}
