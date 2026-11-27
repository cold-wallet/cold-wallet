// PinCodeOnLogin — app-unlock PIN screen. A forgotten PIN can't be recovered (the data is
// encrypted with it), so the only way out is "start a new empty wallet": after a warning, a new PIN
// is chosen and confirmed, and only then is the locked wallet replaced. Backing out at any step
// leaves the locked wallet untouched.
import React, { useEffect, useRef, useState } from "react";
import PinDialog, { BROWSER_PIN_ERROR, NEWER_VERSION_PIN_ERROR } from "../../pin/PinDialog";
import { NewerFormatError } from "../../../services/PinVault";
import type { LockReason } from "../../../services/UserDataService";
import { AUTO_LOCK_AFTER } from "../../../utils/useIdleLock";
import PinSetup from "../../pin/PinSetup";

type Step = 'unlock' | 'confirm-reset' | 'new-pin';

const LOCK_INTRO: Record<LockReason, string> = {
    manual: 'Your portfolio is locked. Enter your PIN to unlock.',
    idle: `Locked after ${Math.round(AUTO_LOCK_AFTER / 60_000)} minutes without activity. Enter your PIN to unlock.`,
    elsewhere: 'The wallet was changed in another tab. Enter its current PIN to unlock.',
};

export default function PinCodeOnLogin(
    { props }: {
        props: {
            /** resolves false on a wrong PIN */
            unlock: (pin: string) => Promise<boolean>,
            createWallet: (pin: string) => void | Promise<void>,
            /** why an open wallet was locked; none after a reload */
            lockReason?: LockReason | null,
        }
    }
) {
    const [step, setStep] = useState<Step>('unlock');
    const [entry, setEntry] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);
    const [wrong, setWrong] = useState(false);
    // why the last attempt couldn't be checked: this browser failed, or the data is from a newer version
    const [failed, setFailed] = useState<'browser' | 'newer' | null>(null);
    const mounted = useRef(true);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

    async function acceptPinCode() {
        if (checking || !entry) return;
        setChecking(true);
        let ok = false, error: 'browser' | 'newer' | null = null;
        try {
            ok = await props.unlock(entry);
        } catch (e) {
            error = e instanceof NewerFormatError ? 'newer' : 'browser';
        }
        if (!mounted.current) return; // unlocked: this screen is gone
        setChecking(false);
        setEntry(null);
        setWrong(!ok && !error);
        setFailed(error);
    }

    if (step === 'new-pin') {
        return <PinSetup title="New empty wallet"
                         intro="Choose a PIN-code for the new wallet. The current one is deleted once you confirm it."
                         onBack={() => setStep('unlock')}
                         onDone={props.createWallet} />;
    }

    if (step === 'unlock') {
        return <PinDialog title="Enter PIN-code"
                          intro={LOCK_INTRO[props.lockReason ?? 'manual']}
                          busy={checking}
                          status={checking ? 'Unlocking…' : wrong ? 'Wrong PIN. Try again.' : failed === 'newer' ? NEWER_VERSION_PIN_ERROR : failed ? BROWSER_PIN_ERROR : undefined}
                          statusError={(wrong || !!failed) && !checking}
                          pin={entry}
                          setPin={(v) => { setEntry(v); if (v) { setWrong(false); setFailed(null); } }}
                          onAccept={acceptPinCode}
                          footer={
                              <button className="pin-reset" disabled={checking} onClick={() => { setEntry(null); setWrong(false); setStep('confirm-reset'); }}>
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
