// components/pin/ChangePin.tsx — Settings → Change PIN, in the same compact dialog as every other
// PIN screen: current PIN first (step 1 of 3), then the new one twice (PinSetup). The wallet is
// locked with the new PIN only after it is confirmed; Back on any step returns to Settings unchanged.
import React, { useEffect, useRef, useState } from 'react';
import Props from '../Props';
import PinDialog, { BROWSER_PIN_ERROR, NEWER_VERSION_PIN_ERROR } from './PinDialog';
import { NewerFormatError } from '../../services/PinVault';
import PinSetup from './PinSetup';
import { PIN_MIN } from './PinPad';

export default function ChangePin({ props }: { props: Props }) {
  const hasPin = props.userDataHolder.pinCodeEncrypted;
  const [verified, setVerified] = useState(!hasPin);
  const [entry, setEntry] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState<'browser' | 'newer' | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const back = () => props.setPinCodeSettingsRequested(false);
  const title = hasPin ? 'Change PIN-code' : 'Set PIN-code';

  async function checkCurrent() {
    if (checking || !entry || entry.length < PIN_MIN) return;
    setChecking(true);
    let ok = false, error: 'browser' | 'newer' | null = null;
    try {
      ok = await props.verifyPin(entry);
    } catch (e) {
      error = e instanceof NewerFormatError ? 'newer' : 'browser';
    }
    if (!mounted.current) return;
    setChecking(false);
    setEntry(null);
    if (ok) setVerified(true);
    else if (error) setFailed(error);
    else setWrong(true);
  }

  async function save(pin: string) {
    await props.setWalletPin(pin);
    if (hasPin) props.setPinChanged(true); // Settings then says what this means for older backups
    props.setPinCodeSettingsRequested(false);
  }

  if (!verified) {
    return (
      <PinDialog
        title={title}
        step="Step 1 of 3"
        onBack={back}
        busy={checking}
        status={checking ? 'Checking…' : wrong ? 'Wrong PIN. Try again.' : failed === 'newer' ? NEWER_VERSION_PIN_ERROR : failed ? BROWSER_PIN_ERROR : 'Enter your current PIN.'}
        statusError={(wrong || !!failed) && !checking}
        pin={entry}
        setPin={(v) => { setEntry(v); if (v) { setWrong(false); setFailed(null); } }}
        onAccept={checkCurrent}
      />
    );
  }
  return <PinSetup title={title} onBack={back} onDone={save} stepOffset={hasPin ? 1 : 0} />;
}
