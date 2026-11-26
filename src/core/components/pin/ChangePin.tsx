// components/pin/ChangePin.tsx — Settings → Change PIN, in the same compact dialog as every other
// PIN screen: current PIN first (step 1 of 3), then the new one twice (PinSetup). The wallet is
// re-encrypted only after the new PIN is confirmed; Back on any step returns to Settings unchanged.
import React, { useState } from 'react';
import Props from '../Props';
import PinDialog from './PinDialog';
import PinSetup from './PinSetup';
import { PIN_MIN } from './PinPad';

export default function ChangePin({ props }: { props: Props }) {
  const current = props.userData.settings.pinCode;
  const [verified, setVerified] = useState(!current);
  const [entry, setEntry] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const back = () => props.setPinCodeSettingsRequested(false);
  const title = current ? 'Change PIN-code' : 'Set PIN-code';

  function checkCurrent() {
    if (!entry || entry.length < PIN_MIN) return;
    if (entry === current) {
      setVerified(true);
    } else {
      setWrong(true);
    }
    setEntry(null);
  }

  function save(pin: string) {
    props.setUserData({ ...props.userData, settings: { ...props.userData.settings, pinCode: pin } });
    props.setPinCode(pin);
    props.setPinCodeSettingsRequested(false);
  }

  if (!verified) {
    return (
      <PinDialog
        title={title}
        step="Step 1 of 3"
        onBack={back}
        status={wrong ? 'Wrong PIN. Try again.' : 'Enter your current PIN.'}
        statusError={wrong}
        pin={entry}
        setPin={(v) => { setEntry(v); if (v) setWrong(false); }}
        onAccept={checkCurrent}
      />
    );
  }
  return <PinSetup title={title} onBack={back} onDone={save} stepOffset={current ? 1 : 0} />;
}
