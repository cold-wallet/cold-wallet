import './index.css'
import React from "react";
import Props from "../../Props";

export default function OkxSettings(props: Props) {
    const showOkxSettings = props.userData.settings.okxIntegrationEnabled || props.okxSettingsEnabled;
    return (
        <div className="setting-unit flex-box flex-direction-column">
            <div className="settings-go-back-row text-label pad layer-3-themed-color"
                 onClick={() => props.setIntegrationWindowNameSelected(null)}>
                {"<< Go back"}
            </div>
            <div className="settings-checkbox-row">
                <label className="text-label clickable"><input
                    type="checkbox"
                    defaultChecked={showOkxSettings}
                    onChange={event =>
                        props.setOkxSettingsEnabled(event.target.checked)
                    }
                />&nbsp;<span>Enable OKX integration</span></label>
            </div>
            <div className="setting-box layer-3-themed-color flex-box flex-direction-column">
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={!props.okxSettingsEnabled}
                           placeholder="OKX API key"
                           className={"setting-okx-token-input"
                               + (props.okxApiKeysInputInvalid ? " invalid" : "")}
                           onChange={event => {
                               props.setOkxApiKeyInput(event.target.value)
                               props.setOkxApiKeysInputInvalid(false)
                           }}
                           defaultValue={props.userData.settings.okxIntegrationApiKey || ""}
                    />
                </div>
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={!props.okxSettingsEnabled}
                           placeholder="OKX API secret"
                           className={"setting-okx-token-input"
                               + (props.okxApiKeysInputInvalid ? " invalid" : "")}
                           onChange={event => {
                               props.setOkxApiSecretInput(event.target.value)
                               props.setOkxApiKeysInputInvalid(false)
                           }}
                           defaultValue={props.userData.settings.okxIntegrationApiSecret || ""}
                    />
                </div>
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={!props.okxSettingsEnabled}
                           placeholder="OKX API pass-phrase"
                           className={"setting-okx-token-input"
                               + (props.okxApiKeysInputInvalid ? " invalid" : "")}
                           onChange={event => {
                               props.setOkxApiPassPhraseInput(event.target.value)
                               props.setOkxApiKeysInputInvalid(false)
                           }}
                           defaultValue={props.userData.settings.okxIntegrationPassPhrase || ""}
                    />
                </div>
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={!props.okxSettingsEnabled}
                           placeholder="OKX API sub-account name"
                           className={"setting-okx-token-input"
                               + (props.okxApiKeysInputInvalid ? " invalid" : "")}
                           onChange={event => {
                               props.setOkxApiSubAccountNameInput(event.target.value)
                               props.setOkxApiKeysInputInvalid(false)
                           }}
                           defaultValue={props.userData.settings.okxIntegrationSubAccountName || ""}
                    />
                </div>
                {props.okxUserDataLoading ? <progress className={"setting-row-progress"}/> : null}
                <div className="setting-integration-info">
                    <a href="https://www.okx.com/account/my-api"
                       target="new-window">How to get OKX API keys</a>
                </div>
            </div>
        </div>
    )
}
