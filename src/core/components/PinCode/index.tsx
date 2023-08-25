import './index.css'
import Dial, {PIN_CODE_MAX_SIZE} from "./Dial";
import React, {Dispatch, SetStateAction} from "react";

export default function PinCode(
    {props}: {
        props: {
            pinCode: string | null,
            setPinCode: Dispatch<SetStateAction<string | null>>,
            acceptPinCode: () => void,
        }
    }
) {
    return (<>
        <div className="pin-code-points flex-box-centered flex-direction-row">{
            [...Array(PIN_CODE_MAX_SIZE)].map((__, i) => (
                <div key={i} className={"pin-code-point"
                    + ((props.pinCode?.length || 0) > i ? " pin-code-point--active" : "")}></div>
            ))
        }</div>
        <Dial props={props}/>
    </>)
}
