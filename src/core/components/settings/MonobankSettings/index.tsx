import './index.css'
import React from "react";
import Props from "../../Props";
import IntegrationSetting from "../IntegrationSetting";

export default function MonobankSettings(props: Props) {
    const showMonobankSettings = props.userData.settings.monobankIntegrationEnabled || props.monobankSettingsEnabled;
    const integrationInfo = (
        <div className="setting-integration-info">
            <a target="new-window" href="https://api.monobank.ua/">How to get monobank API token</a>
        </div>
    )
    return IntegrationSetting(
        props,
        showMonobankSettings,
        "monobank",
        props.setMonobankSettingsEnabled,
        props.monobankUserDataLoading,
        [{
            settingName: "API token",
            isInvalid: props.monobankApiTokenInputInvalid,
            setIsInvalid: props.setMonobankApiTokenInputInvalid,
            setValue: props.setMonobankApiTokenInput,
            defaultValue: props.userData.settings.monobankIntegrationToken,
        }],
        integrationInfo,
    )
}