import './index.css'
import React, {Dispatch, SetStateAction} from "react";
import PinCode from "../../PinCode";
import UserData from "../../../domain/UserData";

export default function PinCodeSetting(
    {props}: {
        props: {
            userData: UserData, setUserData: Dispatch<SetStateAction<UserData>>,
            setPinCodeSettingsRequested: Dispatch<SetStateAction<boolean>>,
            pinCodeEntered: string | null, setPinCodeEntered: Dispatch<SetStateAction<string | null>>,
            pinCodeEnteringFinished: boolean, setPinCodeEnteringFinished: Dispatch<SetStateAction<boolean>>,
            pinCodeRepeatEntered: string | null, setPinCodeRepeatEntered: Dispatch<SetStateAction<string | null>>,
            invalidPinCode: boolean, setInvalidPinCode: Dispatch<SetStateAction<boolean>>,
            currentPinCodeConfirmed: boolean, setCurrentPinCodeConfirmed: Dispatch<SetStateAction<boolean>>,
            deletePinCodeRequested: boolean, setDeletePinCodeRequested: Dispatch<SetStateAction<boolean>>,
        }
    }
) {
    return (
        <div className="setting-unit flex-box flex-direction-column pin-code-setting">
            <div className="settings-go-back-row text-label pad layer-3-themed-color"
                 onClick={() => {
                     props.setPinCodeEntered(null);
                     props.setInvalidPinCode(false);
                     props.setPinCodeRepeatEntered(null);
                     props.setPinCodeEnteringFinished(false);
                     props.setPinCodeSettingsRequested(false);
                     props.setCurrentPinCodeConfirmed(false);
                     props.setDeletePinCodeRequested(false);
                 }}>
                {"<< Go back"}
            </div>
            <div className={"setting-row flex-box-start flex-direction-column"}>
                <div className={"text-label"}>
                    {props.invalidPinCode ? 'PIN-codes does not match. ' : null}{
                    (props.pinCodeEnteringFinished
                        ? 'Repeat'
                        : (props.userData.settings.pinCode
                        && (!props.currentPinCodeConfirmed || props.deletePinCodeRequested)
                            ? 'Enter current'
                            : 'Enter 4-8 digits new'))
                    + ' PIN-code.'
                }</div>
            </div>
            <div className={"setting-row dial-container-wrapper flex-box-centered flex-direction-column"}>
                <PinCode props={props}/>
            </div>
        </div>
    )
}
