import './index.css'
import {Dispatch, SetStateAction, useMemo} from "react";

export const PIN_CODE_MAX_SIZE = 8;
export const PIN_CODE_MIN_SIZE = 4;

interface DialButton {
    symbol: string,
    onClick: () => void,
    activeOn: () => boolean,
}

const buildDialButtonData = (
    index: number,
    pinCode: string | null,
    setPinCode: Dispatch<SetStateAction<string | null>>,
) => ({
    symbol: String(index),
    onClick: () => {
        if ((pinCode?.length || 0) + 1 <= PIN_CODE_MAX_SIZE) {
            setPinCode((pinCode || "") + String(index))
        }
    },
    activeOn: () => pinCode?.length || 0 < PIN_CODE_MAX_SIZE
} as DialButton);

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

export default function Dial(
    {props}: {
        props: {
            pinCode: string | null,
            setPinCode: Dispatch<SetStateAction<string | null>>,
            acceptPinCode: () => void,
        }
    }
) {

    const dialButtons = useMemo(() => {
        const dialButtonsData = [...Array(9)]
            .map((__, i) => buildDialButtonData(i + 1, props.pinCode, props.setPinCode))

        const dialButtons = dialButtonsData.map(buildDialButton)
        dialButtons.push(buildDialButton({
            symbol: '✓',
            onClick: props.acceptPinCode,
            activeOn: () => (!!(props.pinCode)
                && props.pinCode.length <= PIN_CODE_MAX_SIZE
                && props.pinCode.length >= PIN_CODE_MIN_SIZE)
        }))
        dialButtons.push(buildDialButton(buildDialButtonData(0, props.pinCode, props.setPinCode)))
        dialButtons.push(buildDialButton({
            symbol: '⌫',
            onClick: () => {
                if (props.pinCode?.length) {
                    const pinCodeCut = props.pinCode.slice(0, -1);
                    props.setPinCode(pinCodeCut || null)
                }
            },
            activeOn: () => !!(props.pinCode?.length)
        }))
        return dialButtons
    }, [props.pinCode])

    return (<div className={"dial-container"}>{dialButtons}</div>)
}
