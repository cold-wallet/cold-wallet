import './index.css'
import React, {Dispatch, SetStateAction} from "react";
import UserData from "../../../domain/UserData";

export default function OkxSettings(
    userData: UserData,
    setIntegrationWindowNameSelected: Dispatch<SetStateAction<string | null>>,
    showOkxSettings: boolean,
    okxSettingsEnabled: boolean, setOkxSettingsEnabled: Dispatch<SetStateAction<boolean | null>>,
    setOkxApiKeyInput: Dispatch<SetStateAction<string | null>>,
    setOkxApiSecretInput: Dispatch<SetStateAction<string | null>>,
    setOkxApiPassPhraseInput: Dispatch<SetStateAction<string | null>>,
    setOkxApiSubAccountNameInput: Dispatch<SetStateAction<string | null>>,
    okxApiKeysInputInvalid: boolean, setOkxApiKeysInputInvalid: Dispatch<SetStateAction<boolean | null>>,
    okxUserDataLoading: boolean,

) {
    return (
        <div className="setting-unit flex-box flex-direction-column">
            <div className="settings-go-back-row text-label pad layer-3-themed-color"
                 onClick={() => setIntegrationWindowNameSelected(null)}>
                {"<< Go back"}
            </div>
            <div className="settings-checkbox-row">
                <label className="text-label clickable"><input
                    type="checkbox"
                    defaultChecked={showOkxSettings}
                    onChange={event =>
                        setOkxSettingsEnabled(event.target.checked)
                    }
                />&nbsp;<span>Enable OKX integration</span></label>
            </div>
            <div className="setting-box layer-3-themed-color flex-box flex-direction-column">
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={!okxSettingsEnabled}
                           placeholder="OKX API key"
                           className={"setting-okx-token-input"
                               + (okxApiKeysInputInvalid ? " invalid" : "")}
                           onChange={event => {
                               setOkxApiKeyInput(event.target.value)
                               setOkxApiKeysInputInvalid(false)
                           }}
                           defaultValue={userData.settings.okxIntegrationApiKey || ""}
                    />
                </div>
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={!okxSettingsEnabled}
                           placeholder="OKX API secret"
                           className={"setting-okx-token-input"
                               + (okxApiKeysInputInvalid ? " invalid" : "")}
                           onChange={event => {
                               setOkxApiSecretInput(event.target.value)
                               setOkxApiKeysInputInvalid(false)
                           }}
                           defaultValue={userData.settings.okxIntegrationApiSecret || ""}
                    />
                </div>
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={!okxSettingsEnabled}
                           placeholder="OKX API pass-phrase"
                           className={"setting-okx-token-input"
                               + (okxApiKeysInputInvalid ? " invalid" : "")}
                           onChange={event => {
                               setOkxApiPassPhraseInput(event.target.value)
                               setOkxApiKeysInputInvalid(false)
                           }}
                           defaultValue={userData.settings.okxIntegrationPassPhrase || ""}
                    />
                </div>
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={!okxSettingsEnabled}
                           placeholder="OKX API sub-account name"
                           className={"setting-okx-token-input"
                               + (okxApiKeysInputInvalid ? " invalid" : "")}
                           onChange={event => {
                               setOkxApiSubAccountNameInput(event.target.value)
                               setOkxApiKeysInputInvalid(false)
                           }}
                           defaultValue={userData.settings.okxIntegrationSubAccountName || ""}
                    />
                </div>
                {okxUserDataLoading ? <progress className={"setting-row-progress"}/> : null}
                <div className="setting-integration-info">
                    <a href="https://www.okx.com/account/my-api"
                       target="new-window">How to get OKX API keys</a>
                </div>
            </div>
        </div>
    )
}
