import './index.css'
import Dial, {PIN_CODE_MAX_SIZE} from "./Dial";
import React, {Dispatch, SetStateAction, useMemo} from "react";

export default function PinCode(
    {props}: {
        props: {
            pinCode: string | null,
            setPinCode: Dispatch<SetStateAction<string | null>>,
            acceptPinCode: () => void,
        }
    }
) {
    const points = useMemo(() => [...Array(PIN_CODE_MAX_SIZE)].map((__, i) => (
        <div key={i} className={"pin-code-point"
            + ((props.pinCode?.length || 0) > i ? " pin-code-point--active" : "")}></div>
    )), [props.pinCode]);
    return (<>
        <div className="pin-code-points flex-box-centered flex-direction-row">{points}</div>
        <Dial props={props}/>
    </>)
}
