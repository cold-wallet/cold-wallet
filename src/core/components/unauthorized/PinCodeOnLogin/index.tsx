// PinCodeOnLogin — app-unlock PIN screen. A forgotten PIN can't be recovered (the data is
// encrypted with it), so the only way out is "start a new empty wallet": after a warning, a new PIN
// is chosen and confirmed, and only then is the locked wallet replaced. Backing out at any step
// leaves the locked wallet untouched.
import React, { Dispatch, SetStateAction, useState } from "react";
import PinPad from "../../pin/PinPad";
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

    return (
        <div className="scrim" style={{ zIndex: 80 }}>
            {step === 'confirm-reset' ? (
                <div className="dialog pin-reset-confirm" style={{ width: 380 }} role="alertdialog" aria-labelledby="pin-reset-title">
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
            ) : (
                <div className="dialog" style={{ width: 360 }}>
                    <div className="cfg-title" style={{ justifyContent: 'center', marginBottom: 4 }}>
                        <span className="intg__chip" style={{ background: 'var(--accent)', width: 32, height: 32, borderRadius: 9, color: 'var(--accent-ink)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                        </span>
                        <b>Enter PIN-code</b>
                    </div>
                    <p className="data-desc" style={{ textAlign: 'center' }}>Your portfolio is locked. Enter your PIN to unlock.</p>
                    <PinPad pinCode={props.pinCodeEntered} setPinCode={props.setPinCodeEntered} acceptPinCode={acceptPinCode} />
                    <button className="pin-reset" onClick={() => { props.setPinCodeEntered(null); setStep('confirm-reset'); }}>
                        Forgot PIN? Start a new empty wallet
                    </button>
                </div>
            )}
        </div>
    );
}
