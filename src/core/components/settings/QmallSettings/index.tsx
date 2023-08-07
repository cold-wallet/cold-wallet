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
                    // defaultChecked={showBinanceSettings}
                    // onChange={event =>
                    //     setBinanceSettingsEnabled(event.target.checked)
                    // }
                />&nbsp;<span>Enable qmall integration</span></label>
            </div>
            <div className="setting-box layer-3-themed-color flex-box flex-direction-column">
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={true/*!binanceSettingsEnabled*/}
                           placeholder="qmall API key"
                           className={"setting-qmall-token-input"
                               /*+ (binanceApiKeysInputInvalid ? " invalid" : "")*/}
                        // onChange={event => {
                        //     setBinanceApiKeyInput(event.target.value)
                        //     setBinanceApiKeysInputInvalid(false)
                        // }}
                        // defaultValue={userData.settings.binanceIntegrationApiKey}
                    />
                </div>
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={true/*!binanceSettingsEnabled*/}
                           placeholder="qmall API secret"
                           className={"setting-qmall-token-input"
                               /*+ (binanceApiKeysInputInvalid ? " invalid" : "")*/}
                        // onChange={event => {
                        //     setBinanceApiSecretInput(event.target.value)
                        //     setBinanceApiKeysInputInvalid(false)
                        // }}
                        // defaultValue={userData.settings.binanceIntegrationApiSecret}
                    />
                </div>
                {/*{binanceUserDataLoading ? <progress className={"setting-row-progress"}/> : null}*/}
            </div>
        </div>
    )
}
