import './index.css'
import React, {Dispatch, SetStateAction} from "react";
import PinCode from "../../PinCode";
import UserData from "../../../domain/UserData";
import {PIN_CODE_MAX_SIZE, PIN_CODE_MIN_SIZE} from "../../PinCode/Dial";

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
    const pinCode = props.pinCodeEnteringFinished ? props.pinCodeRepeatEntered : props.pinCodeEntered
    const setPinCode = props.pinCodeEnteringFinished
        ? props.setPinCodeRepeatEntered : props.setPinCodeEntered

    function acceptPinCode() {
        if (!(pinCode && pinCode.length >= PIN_CODE_MIN_SIZE && pinCode.length <= PIN_CODE_MAX_SIZE)) {
            return;
        }
        if (props.pinCodeEnteringFinished) {
            if (props.pinCodeRepeatEntered === props.pinCodeEntered) {
                const newUserData = {...props.userData}
                newUserData.settings.pinCode = pinCode
                props.setUserData(newUserData)
                props.setPinCodeEntered(null)
                props.setPinCodeRepeatEntered(null)
                props.setPinCodeEnteringFinished(false)
                props.setPinCodeSettingsRequested(false);
                props.setCurrentPinCodeConfirmed(false);
            } else {
                props.setInvalidPinCode(true)
                props.setPinCodeEntered(null)
                props.setPinCodeRepeatEntered(null)
                props.setPinCodeEnteringFinished(false)
            }
        } else if (props.userData.settings.pinCode
            && (!props.currentPinCodeConfirmed || props.deletePinCodeRequested)
        ) {
            if (pinCode === props.userData.settings.pinCode) {
                if (props.deletePinCodeRequested) {
                    const newUserData = {...props.userData}
                    newUserData.settings.pinCode = null
                    props.setUserData(newUserData)
                    props.setPinCodeEntered(null)
                    props.setPinCodeRepeatEntered(null)
                    props.setPinCodeEnteringFinished(false)
                    props.setPinCodeSettingsRequested(false);
                    props.setCurrentPinCodeConfirmed(false);
                    props.setInvalidPinCode(false)
                    props.setDeletePinCodeRequested(false)
                } else if (!props.currentPinCodeConfirmed) {
                    props.setCurrentPinCodeConfirmed(true)
                    props.setPinCodeEntered(null)
                    props.setInvalidPinCode(false)
                }
            } else {
                props.setInvalidPinCode(true)
                props.setPinCodeEntered(null)
            }
        } else {
            props.setInvalidPinCode(false)
            props.setPinCodeEnteringFinished(true)
        }
    }
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
                <PinCode props={{
                    pinCode,
                    setPinCode,
                    acceptPinCode,
                }}/>
            </div>
        </div>
    )
}
