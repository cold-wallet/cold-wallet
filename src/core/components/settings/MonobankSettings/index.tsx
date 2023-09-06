import './index.css'
import React from "react";
import Props from "../../Props";

export default function MonobankSettings(props: Props) {
    const showMonobankSettings = props.userData.settings.monobankIntegrationEnabled || props.monobankSettingsEnabled;
    return (
        <div className="setting-unit flex-box flex-direction-column">
            <div className="settings-go-back-row text-label pad layer-3-themed-color"
                 onClick={() => props.setIntegrationWindowNameSelected(null)}>
                {"<< Go back"}
            </div>
            <div className="settings-checkbox-row">
                <label className="text-label clickable"><input
                    type="checkbox"
                    defaultChecked={showMonobankSettings}
                    onChange={event =>
                        props.setMonobankSettingsEnabled(event.target.checked)
                    }
                />&nbsp;<span>Enable monobank integration</span></label>
            </div>
            <div className="setting-box layer-3-themed-color flex-box flex-direction-column">
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={!props.monobankSettingsEnabled}
                           placeholder="monobank API token"
                           className={"setting-monobank-token-input"
                               + (props.monobankApiTokenInputInvalid ? " invalid" : "")}
                           onChange={event => {
                               props.setMonobankApiTokenInput(event.target.value)
                               props.setMonobankApiTokenInputInvalid(false)
                           }}
                           defaultValue={props.userData.settings.monobankIntegrationToken || ""}
                    />
                    {props.monobankUserDataLoading ? <progress className={"setting-row-progress"}/> : null}
                </div>
                <div className="setting-integration-info">
                    <a target="new-window" href="https://api.monobank.ua/">How to get monobank API token</a>
                </div>
            </div>
        </div>
    )
}