// PinCodeOnLogin — app-unlock PIN screen, reskinned to the new keypad. Same mechanics.
import React, { Dispatch, SetStateAction } from "react";
import PinPad from "../../redesign/PinPad";

export default function PinCodeOnLogin(
    { props }: {
        props: {
            pinCodeEntered: string | null,
            setPinCodeEntered: Dispatch<SetStateAction<string | null>>,
            setPinCode: Dispatch<SetStateAction<string | null>>,
        }
    }
) {
    function acceptPinCode() {
        props.setPinCode(props.pinCodeEntered);
        props.setPinCodeEntered(null);
    }

    return (
        <div className="scrim" style={{ zIndex: 80 }}>
            <div className="dialog" style={{ width: 360 }}>
                <div className="cfg-title" style={{ justifyContent: 'center', marginBottom: 4 }}>
                    <span className="intg__chip" style={{ background: 'var(--accent)', width: 32, height: 32, borderRadius: 9, color: 'var(--accent-ink)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                    </span>
                    <b>Enter PIN-code</b>
                </div>
                <p className="data-desc" style={{ textAlign: 'center' }}>Your portfolio is locked. Enter your PIN to unlock.</p>
                <PinPad pinCode={props.pinCodeEntered} setPinCode={props.setPinCodeEntered} acceptPinCode={acceptPinCode} />
            </div>
        </div>
    );
}
