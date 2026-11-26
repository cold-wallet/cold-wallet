// PinCodeOnLogin — app-unlock PIN screen. A forgotten PIN can't be recovered (the data is
// encrypted with it), so the only way out is "start a new empty wallet": after a warning, a new PIN
// is chosen and confirmed, and only then is the locked wallet replaced. Backing out at any step
// leaves the locked wallet untouched.
import React, { Dispatch, SetStateAction, useState } from "react";
import PinDialog from "../../pin/PinDialog";
import PinSetup from "../../pin/PinSetup";

type Step = 'unlock' | 'confirm-reset' | 'new-pin';

export default function PinCodeOnLogin(
    { props }: {
        props: {
            pinCodeEntered: string | null,
            setPinCodeEntered: Dispatch<SetStateAction<string | null>>,
            setPinCode: Dispatch<SetStateAction<string | null>>,
            createWallet: (pin: string) => void,
        }
    }
) {
    const [step, setStep] = useState<Step>('unlock');

    function acceptPinCode() {
        props.setPinCode(props.pinCodeEntered);
        props.setPinCodeEntered(null);
    }

    if (step === 'new-pin') {
        return <PinSetup title="New empty wallet"
                         intro="Choose a PIN-code for the new wallet. The current one is deleted once you confirm it."
                         onBack={() => setStep('unlock')}
                         onDone={props.createWallet} />;
    }

    if (step === 'unlock') {
        return <PinDialog title="Enter PIN-code"
                          intro="Your portfolio is locked. Enter your PIN to unlock."
                          pin={props.pinCodeEntered}
                          setPin={props.setPinCodeEntered}
                          onAccept={acceptPinCode}
                          footer={
                              <button className="pin-reset" onClick={() => { props.setPinCodeEntered(null); setStep('confirm-reset'); }}>
                                  Forgot PIN? Start a new empty wallet
                              </button>
                          } />;
    }

    return (
        <div className="scrim" style={{ zIndex: 80 }}>
            <div className="dialog pin-dialog pin-reset-confirm" role="alertdialog" aria-labelledby="pin-reset-title">
                <h3 id="pin-reset-title">Start a new empty wallet?</h3>
                <p className="data-desc">
                    {"The wallet on this device will be deleted for good, with all its holdings and settings. "
                        + "Without its PIN it can't be opened again, unless you have a backup token and its PIN."}
                </p>
                <div className="dialog__actions">
                    <button className="btn" onClick={() => setStep('unlock')}>Cancel</button>
                    <button className="btn btn--danger" onClick={() => setStep('new-pin')}>Continue</button>
                </div>
            </div>
        </div>
    );
}
