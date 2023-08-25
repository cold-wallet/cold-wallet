import './index.css'
import UserData from "../../../domain/UserData";
import React, {Dispatch, SetStateAction} from "react";
import ModalWindow from "../../ModalWindow";
import PinCode from "../../PinCode";

export default function PinCodeOnLogin(
    {props}: {
        props: {
            userData: UserData,
            setPinCodeEnteredSuccessfully: Dispatch<SetStateAction<boolean>>,
            pinCodeEntered: string | null,
            setPinCodeEntered: Dispatch<SetStateAction<string | null>>,
        }
    }
) {
    function acceptPinCode() {
        if (props.pinCodeEntered === props.userData.settings.pinCode) {
            props.setPinCodeEnteredSuccessfully(true)
        }
        props.setPinCodeEntered(null)
    }

    return <ModalWindow
        closeable={false}
        large={false}
        long={true}
        title={"Enter PIN-code"}
        children={
            <div className="pin-code-wrapper flex-box-centered flex-direction-column">
                <PinCode props={{
                    pinCode: props.pinCodeEntered,
                    setPinCode: props.setPinCodeEntered,
                    acceptPinCode,
                }}/>
            </div>
        }/>
}
