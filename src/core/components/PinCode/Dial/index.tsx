import './index.css'
import {Dispatch, SetStateAction} from "react";

export const PIN_CODE_MAX_SIZE = 8;
export const PIN_CODE_MIN_SIZE = 4;

export default function Dial(
    {props}: {
        props: {
            pinCode: string | null,
            setPinCode: Dispatch<SetStateAction<string | null>>,
            acceptPinCode: () => void,
        }
    }
) {

    interface DialButton {
        symbol: string,
        onClick: () => void,
        activeOn: () => boolean,
    }

    const buildDialButtonData = (index: number) => ({
        symbol: String(index),
        onClick: () => {
            if ((props.pinCode?.length || 0) + 1 <= PIN_CODE_MAX_SIZE) {
                props.setPinCode((props.pinCode || "") + String(index))
            }
        },
        activeOn: () => props.pinCode?.length || 0 < PIN_CODE_MAX_SIZE
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
        onClick: props.acceptPinCode,
        activeOn: () => (!!(props.pinCode)
            && props.pinCode.length <= PIN_CODE_MAX_SIZE
            && props.pinCode.length >= PIN_CODE_MIN_SIZE)
    }))
    dialButtons.push(buildDialButton(buildDialButtonData(0)))
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
    return (<div className={"dial-container"}>{dialButtons}</div>)
}
