import './index.css'
import Dial, {PIN_CODE_MAX_SIZE} from "./Dial";
import React, {Dispatch, SetStateAction} from "react";
import UserData from "../../domain/UserData";

export default function PinCode(
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
    return (<>
        <div className="pin-code-points flex-box-centered flex-direction-row">{
            [...Array(PIN_CODE_MAX_SIZE)].map((__, i) => (
                <div key={i} className={"pin-code-point"
                    + ((pinCode?.length || 0) > i ? " pin-code-point--active" : "")}></div>
            ))
        }</div>
        <Dial props={props}/>
    </>)
}
