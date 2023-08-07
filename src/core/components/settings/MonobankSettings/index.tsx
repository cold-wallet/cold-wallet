import './index.css'
import React, {Dispatch, SetStateAction} from "react";
import UserData from "../../../domain/UserData";

export default function MonobankSettings(
    userData: UserData,
    setIntegrationWindowNameSelected: Dispatch<SetStateAction<string | null>>,
    showMonobankSettings: boolean,
    monobankSettingsEnabled: boolean,
    setMonobankSettingsEnabled: Dispatch<SetStateAction<boolean | null>>,
    monobankApiTokenInputInvalid: boolean,
    setMonobankApiTokenInputInvalid: Dispatch<SetStateAction<boolean | null>>,
    setMonobankApiTokenInput: Dispatch<SetStateAction<string | null>>,
    monobankUserDataLoading: boolean,
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
                    defaultChecked={showMonobankSettings}
                    onChange={event =>
                        setMonobankSettingsEnabled(event.target.checked)
                    }
                />&nbsp;<span>Enable monobank integration</span></label>
            </div>
            <div className="setting-box layer-3-themed-color flex-box flex-direction-column">
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={!monobankSettingsEnabled}
                           placeholder="monobank API token"
                           className={"setting-monobank-token-input"
                               + (monobankApiTokenInputInvalid ? " invalid" : "")}
                           onChange={event => {
                               setMonobankApiTokenInput(event.target.value)
                               setMonobankApiTokenInputInvalid(false)
                           }}
                           defaultValue={userData.settings.monobankIntegrationToken || ""}
                    />
                    {monobankUserDataLoading ? <progress className={"setting-row-progress"}/> : null}
                </div>
                <div className="setting-integration-info">
                    <a target="new-window" href="https://api.monobank.ua/">How to get monobank API token</a>
                </div>
            </div>
        </div>
    )
}