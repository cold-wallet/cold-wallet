import React, {Dispatch, SetStateAction} from "react";
import UserData from "../../../domain/UserData";

export default function QmallSettings(
    userData: UserData,
    setIntegrationWindowNameSelected: Dispatch<SetStateAction<string | null>>,
) {
    return (
        <div className="setting-unit flex-box flex-direction-column">
            <div className="settings-go-back-row text-label pad layer-3-themed-color"
                 onClick={() => setIntegrationWindowNameSelected(null)}>
                {"<< Go back"}
            </div>
            <p className={"text-label"}>Qmall integration coming soon!</p>
            <div className="settings-checkbox-row">
                <label className="text-label clickable"><input
                    type="checkbox"
                    disabled={true}
                />&nbsp;<span>Enable qmall integration</span></label>
            </div>
            <div className="setting-box layer-3-themed-color flex-box flex-direction-column">
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={true}
                           placeholder="qmall API key"
                           className={"setting-qmall-token-input"}
                    />
                </div>
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={true}
                           placeholder="qmall API secret"
                           className={"setting-qmall-token-input"}
                    />
                </div>
            </div>
        </div>
    )
}
