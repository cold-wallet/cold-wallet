import './index.css'
import React from "react";
import Props from "../../Props";
import IntegrationSetting from "../IntegrationSetting";

export default function OkxSettings(props: Props) {
    const showOkxSettings = props.userData.settings.okxIntegrationEnabled || props.okxSettingsEnabled;
    const integrationInfo = (
        <div className="setting-integration-info">
            <a href="https://www.okx.com/account/my-api" target="new-window">How to get OKX API keys</a>
        </div>
    )
    return IntegrationSetting(
        props,
        showOkxSettings,
        "okx",
        props.setOkxSettingsEnabled,
        props.okxUserDataLoading,
        [{
            settingName: "API key",
            isInvalid: props.okxApiKeysInputInvalid,
            setIsInvalid: props.setOkxApiKeysInputInvalid,
            setValue: props.setOkxApiKeyInput,
            defaultValue: props.userData.settings.okxIntegrationApiKey,
        }, {
            settingName: "API secret",
            isInvalid: props.okxApiKeysInputInvalid,
            setIsInvalid: props.setOkxApiKeysInputInvalid,
            setValue: props.setOkxApiSecretInput,
            defaultValue: props.userData.settings.okxIntegrationApiSecret,
        }, {
            settingName: "API pass-phrase",
            isInvalid: props.okxApiKeysInputInvalid,
            setIsInvalid: props.setOkxApiKeysInputInvalid,
            setValue: props.setOkxApiPassPhraseInput,
            defaultValue: props.userData.settings.okxIntegrationPassPhrase,
        }, {
            settingName: "API sub-account name",
            isInvalid: props.okxApiKeysInputInvalid,
            setIsInvalid: props.setOkxApiKeysInputInvalid,
            setValue: props.setOkxApiSubAccountNameInput,
            defaultValue: props.userData.settings.okxIntegrationSubAccountName,
        }],
        integrationInfo,
    )
}
