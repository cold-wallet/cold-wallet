import './index.css'
import {Dispatch, SetStateAction} from "react";
import UserData from "../../../domain/UserData";

export const PIN_CODE_MAX_SIZE = 8;
export const PIN_CODE_MIN_SIZE = 4;

export default function Dial(
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
    const changingPinCode = props.userData.settings.pinCode !== null
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
        } else if (changingPinCode && (!props.currentPinCodeConfirmed || props.deletePinCodeRequested)) {
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

    interface DialButton {
        symbol: string,
        onClick: () => void,
        activeOn: () => boolean,
    }

    const buildDialButtonData = (index: number) => ({
        symbol: String(index),
        onClick: () => {
            if ((pinCode?.length || 0) + 1 <= PIN_CODE_MAX_SIZE) {
                setPinCode((pinCode || "") + String(index))
            }
        },
        activeOn: () => pinCode?.length || 0 < PIN_CODE_MAX_SIZE
    } as DialButton);

    const dialButtonsData = [...Array(9)].map((__, i) => buildDialButtonData(i + 1))

    const buildDialButton = (dialButton: DialButton) => (
        <div key={dialButton.symbol}
             onClick={() => {
                 if (dialButton.activeOn()) {
                     dialButton.onClick()
                 }
             }}
             className={"dial-button pad layer-3-themed-color" + (dialButton.activeOn() ? "" : " disabled")}>
            {dialButton.symbol}
        </div>
    );
    const dialButtons = dialButtonsData.map(buildDialButton)
    dialButtons.push(buildDialButton({
        symbol: '✓',
        onClick: acceptPinCode,
        activeOn: () => (!!(pinCode) && pinCode.length <= PIN_CODE_MAX_SIZE && pinCode.length >= PIN_CODE_MIN_SIZE)
    }))
    dialButtons.push(buildDialButton(buildDialButtonData(0)))
    dialButtons.push(buildDialButton({
        symbol: '⌫',
        onClick: () => {
            if (pinCode?.length) {
                const pinCodeCut = pinCode.slice(0, -1);
                setPinCode(pinCodeCut || null)
            }
        },
        activeOn: () => !!(pinCode?.length)
    }))
    return (<div className={"dial-container"}>{dialButtons}</div>)
}
