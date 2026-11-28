// PinCodeOnLogin — the PIN card of the lock screen (shown on the Vault's doors). A forgotten PIN can't be recovered (the data is
// encrypted with it), so "Forgot PIN?" explains that and offers the start screen, where a new wallet
// can be created or one imported from a token. The locked wallet stays until one of those finishes.
import React, { useEffect, useRef, useState } from "react";
import PinDialog, { BROWSER_PIN_ERROR, NEWER_VERSION_PIN_ERROR } from "../../pin/PinDialog";
import { NewerFormatError } from "../../../services/PinVault";
import type { LockReason } from "../../../services/UserDataService";
import { AUTO_LOCK_AFTER } from "../../../utils/useIdleLock";
import VaultEmblem from "../../vault/VaultEmblem";

type Step = 'unlock' | 'forgot';

const LOCK_INTRO: Record<LockReason, string> = {
    manual: 'Your portfolio is locked.',
    idle: `Locked after ${Math.round(AUTO_LOCK_AFTER / 60_000)} minutes without activity.`,
    elsewhere: 'The wallet was changed in another tab. Enter its current PIN to unlock.',
    outdated: 'An older copy of Cold Wallet in another tab saved this wallet. Reload or close that tab, then enter your PIN.',
};

export default function PinCodeOnLogin(
    { props }: {
        props: {
            /** resolves false on a wrong PIN */
            unlock: (pin: string) => Promise<boolean>,
            /** why an open wallet was locked; none after a reload */
            lockReason?: LockReason | null,
            /** show the start screen (create or import a wallet) in place of this one */
            startOver: () => void,
        }
    }
) {
    const [step, setStep] = useState<Step>('unlock');
    const [entry, setEntry] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);
    const [wrong, setWrong] = useState(false);
    // why the last attempt couldn't be checked: this browser failed, or the data is from a newer version
    const [failed, setFailed] = useState<'browser' | 'newer' | null>(null);
    // counts wrong PINs: each one shakes the card
    const [wrongCount, setWrongCount] = useState(0);
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
        if (!ok && !error) setWrongCount((n) => n + 1);
        setFailed(error);
    }

    if (step === 'unlock') {
        return <PinDialog title="Enter PIN"
                          mark={<VaultEmblem className="pin-dialog__mark" />}
                          bare
                          shake={wrongCount}
                          intro={LOCK_INTRO[props.lockReason ?? 'manual']}
                          busy={checking}
                          status={checking ? 'Unlocking…' : wrong ? 'Wrong PIN. Try again.' : failed === 'newer' ? NEWER_VERSION_PIN_ERROR : failed ? BROWSER_PIN_ERROR : undefined}
                          statusError={(wrong || !!failed) && !checking}
                          pin={entry}
                          setPin={(v) => { setEntry(v); if (v) { setWrong(false); setFailed(null); } }}
                          onAccept={acceptPinCode}
                          footer={
                              <button className="pin-reset" disabled={checking} onClick={() => { setEntry(null); setWrong(false); setStep('forgot'); }}>
                                  Forgot PIN?
                              </button>
                          } />;
    }

    return (
        <div className="scrim" style={{ zIndex: 80 }}>
            <div className="dialog pin-dialog pin-reset-confirm" role="alertdialog" aria-labelledby="pin-reset-title">
                <h3 id="pin-reset-title">Forgot the PIN?</h3>
                <p className="data-desc">
                    {"Without its PIN, the wallet on this device can't be opened. On the start screen you can "
                        + "create a new wallet or import one from a token. The locked wallet stays until you do, "
                        + "then it's replaced for good."}
                </p>
                <div className="dialog__actions">
                    <button className="btn" onClick={() => setStep('unlock')}>Cancel</button>
                    <button className="btn btn--p" onClick={props.startOver}>Go to start screen</button>
                </div>
            </div>
        </div>
    );
}
