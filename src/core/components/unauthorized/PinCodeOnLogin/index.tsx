import './index.css'
import React, {Dispatch, SetStateAction} from "react";
import ModalWindow from "../../ModalWindow";
import PinCode from "../../PinCode";

export default function PinCodeOnLogin(
    {props}: {
        props: {
            pinCodeEntered: string | null,
            setPinCodeEntered: Dispatch<SetStateAction<string | null>>,
            setPinCode: Dispatch<SetStateAction<string | null>>,
        }
    }
) {
    function acceptPinCode() {
        props.setPinCode(props.pinCodeEntered)
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
