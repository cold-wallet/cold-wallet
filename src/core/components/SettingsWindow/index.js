import './index.css';
import ModalWindow from "../ModalWindow";
import NeutralButton from "../buttons/NeutralButton";
import React from "react";
import PositiveButton from "../buttons/PositiveButton";
import monobankApiClient from "../../integrations/monobank/monobankApiClient.ts";

export default function SettingsWindow({
                                           stateReset,
                                           userData,
                                           setUserData,
                                           monobankSettingsEnabled,
                                           setMonobankSettingsEnabled,
                                           monobankApiTokenInput,
                                           setMonobankApiTokenInput,
                                           monobankApiTokenInputInvalid,
                                           setMonobankApiTokenInputInvalid,
                                           monobankUserData,
                                           setMonobankUserData,
                                       }) {
    function onCancelClicked() {
        stateReset()
    }

    const showMonobankSettings = userData.settings.monobankIntegrationEnabled || monobankSettingsEnabled;

    class SettingsValidationResult {
        monobankTokenInputInvalid = false;

        isValid() {
            return !this.monobankTokenInputInvalid
        }
    }

    async function validateSettings() {
        const settingsValidationResult = new SettingsValidationResult();

        if (!userData.settings.monobankIntegrationEnabled && monobankSettingsEnabled) {
            if (!monobankApiTokenInput) {
                settingsValidationResult.monobankTokenInputInvalid = true;
            } else {
                let response = await monobankApiClient.getUserInfo(monobankApiTokenInput);
                if (response.success) {
                    setMonobankUserData(response.result)
                } else {
                    settingsValidationResult.monobankTokenInputInvalid = true;
                }
            }
        }
        //todo: add binance settings check
        return settingsValidationResult;
    }

    function onSaveClicked() {
        validateSettings()
            .then(settingsValidationResult => {
                if (settingsValidationResult.isValid()) {
                    const userDataNew = {...userData};
                    let shouldSave = false;
                    if (!userDataNew.settings) {
                        userDataNew.settings = {};
                    }
                    if (monobankSettingsEnabled !== null
                        && userDataNew.settings.monobankIntegrationEnabled !== monobankSettingsEnabled
                    ) {
                        userDataNew.settings.monobankIntegrationEnabled = monobankSettingsEnabled;
                        shouldSave = true;
                    }
                    if (monobankApiTokenInput !== null
                        && userDataNew.settings.monobankIntegrationToken !== monobankApiTokenInput
                    ) {
                        userDataNew.settings.monobankIntegrationToken = monobankApiTokenInput;
                        shouldSave = true;
                    }
                    if (shouldSave) {
                        setUserData(userDataNew);
                    }
                    stateReset();
                } else {
                    if (settingsValidationResult.monobankTokenInputInvalid) {
                        setMonobankApiTokenInputInvalid(true)
                    }
                }
            })
            .catch(reason => {
                console.info(reason)
            })
    }

    function MonobankSettings() {
        return (
            <div className="setting-unit monobank-settings flex-box flex-direction-column">
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
                    <div className={"setting-row"}>
                        <input type="text"
                               disabled={!monobankSettingsEnabled}
                               placeholder="monobank API token"
                               className={"setting-monobank-token-input"
                                   + (monobankApiTokenInputInvalid ? " invalid" : "")}
                               onChange={event => {
                                   setMonobankApiTokenInput(event.target.value)
                                   setMonobankApiTokenInputInvalid(false)
                               }}
                               defaultValue={userData.settings.monobankIntegrationToken}
                        />
                        {
                            // !this.state.saveSettingsRequested ? null : (
                            //     <span>Checking...</span>
                            //     //    todo: add loading animation
                            // )
                        }
                    </div>
                    <div className="setting-monobank-info">
                        <a target="new-window" href="https://api.monobank.ua/">Get monobank API
                            token here</a>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <ModalWindow
            closeable={true}
            large={true}
            onCancel={stateReset}
            title={"Settings"}
            children={
                <div className="settings-box">
                    {MonobankSettings({})}
                </div>
            }
            bottom={[
                <PositiveButton onClick={onSaveClicked}
                                key={"save"}
                                className="settings-window-bottom-button">Save
                </PositiveButton>,
                <NeutralButton onClick={onCancelClicked}
                               key={"cancel"}
                               className="settings-window-bottom-button">Cancel
                </NeutralButton>
            ]}
        />
    )
}
