import './index.css'
import React from "react";
import Props from "../../Props";
import IntegrationSetting from "../IntegrationSetting";

export default function BinanceSettings(props: Props) {
    const showBinanceSettings = props.userData.settings.binanceIntegrationEnabled || props.binanceSettingsEnabled;
    const integrationInfo = (
        <div className="setting-integration-info">
            <a href="https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072"
               target="new-window">How to get binance API keys</a>
        </div>
    )
    return IntegrationSetting(
        props,
        showBinanceSettings,
        "binance",
        props.setBinanceSettingsEnabled,
        props.binanceUserDataLoading,
        [{
            settingName: "API key",
            isInvalid: props.binanceApiKeysInputInvalid,
            setIsInvalid: props.setBinanceApiKeysInputInvalid,
            setValue: props.setBinanceApiKeyInput,
            defaultValue: props.userData.settings.binanceIntegrationApiKey,
        }, {
            settingName: "API secret",
            isInvalid: props.binanceApiKeysInputInvalid,
            setIsInvalid: props.setBinanceApiKeysInputInvalid,
            setValue: props.setBinanceApiSecretInput,
            defaultValue: props.userData.settings.binanceIntegrationApiSecret,
        }],
        integrationInfo,
    )
}
