// components/pin/PinSetup.tsx — choose a new PIN in two steps: enter it, then enter it again.
// Nothing is saved here: `onDone` gets the PIN only after both entries matched, and the caller
// creates / re-encrypts the wallet then. On a mismatch the flow starts over from the first step,
// since there is no telling which of the two entries had the typo. Used for a new wallet, for a
// wallet that has no PIN yet (old or imported), for "start a new empty wallet" on the lock screen,
// and for Settings → Change PIN (after the current PIN, hence `stepOffset`).
import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { PIN_MAX, PIN_MIN } from './PinPad';
import PinDialog, { ForgetPinWarning } from './PinDialog';

interface PinSetupProps {
  title: string;
  /** shown above the step prompt (why a PIN is being asked for) */
  intro?: ReactNode;
  /** "Back" leaves the flow without saving anything; omitted when there is nowhere to go back to */
  onBack?: () => void;
  /** may return a promise (the wallet is being locked with the PIN): the keypad waits for it */
  onDone: (pin: string) => void | Promise<void>;
  /** steps shown before this flow (Change PIN asks for the current PIN first) */
  stepOffset?: number;
}

export default function PinSetup({ title, intro, onBack, onDone, stepOffset = 0 }: PinSetupProps) {
  const [first, setFirst] = useState<string | null>(null);
  const [entry, setEntry] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const confirming = first !== null;

  async function accept() {
    if (busy || !entry || entry.length < PIN_MIN || entry.length > PIN_MAX) return;
    if (!confirming) {
      setFirst(entry);
      setEntry(null);
      setMismatch(false);
      setFailed(false);
    } else if (entry === first) {
      setBusy(true);
      setFailed(false);
      try {
        await onDone(entry);
      } catch {
        // the browser couldn't lock the wallet with this PIN: nothing was saved; let them retry
        if (mounted.current) { setFailed(true); setFirst(null); setEntry(null); }
      } finally {
        if (mounted.current) setBusy(false);
      }
    } else {
      setFirst(null);
      setEntry(null);
      setMismatch(true);
    }
  }

  return (
    <PinDialog
      title={title}
      intro={intro}
      step={`Step ${stepOffset + (confirming ? 2 : 1)} of ${stepOffset + 2}`}
      onBack={onBack}
      busy={busy}
      status={busy ? 'Locking the wallet with your PIN…'
        : failed ? "This browser couldn't lock the wallet with the PIN (it may be short on memory). Nothing was saved. Try again, or use another browser."
        : confirming ? 'Enter the same PIN again to confirm it.'
        : mismatch ? "The PINs didn't match. Choose your PIN again."
          : `Choose a ${PIN_MIN}–${PIN_MAX} digit PIN.`}
      statusError={(mismatch || failed) && !confirming && !busy}
      pin={entry}
      setPin={setEntry}
      onAccept={accept}
      footer={<ForgetPinWarning />}
    />
  );
}
