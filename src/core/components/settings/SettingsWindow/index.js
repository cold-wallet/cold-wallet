import './index.css';
import React from "react";
import monobankIntegration from "../../integrations/MonobankIntegrationPad";
import binanceIntegration from "../../integrations/BinanceIntegrationPad";
import qmallIntegration from "../../integrations/QmallIntegrationPad";
import IntegrationSettings from "../IntegrationSettings";

export default function SettingsWindow(
    {
        stateReset,
        userData, setUserData,
        monobankSettingsEnabled, setMonobankSettingsEnabled,
        monobankApiTokenInput, setMonobankApiTokenInput,
        monobankApiTokenInputInvalid, setMonobankApiTokenInputInvalid,
        monobankUserData, setMonobankUserData,
        monobankUserDataLoading, setMonobankUserDataLoading,
        integrationWindowNameSelected, setIntegrationWindowNameSelected,
        binanceCurrencies,
        binanceSettingsEnabled, setBinanceSettingsEnabled,
        binanceApiKeyInput, setBinanceApiKeyInput,
        binanceApiSecretInput, setBinanceApiSecretInput,
        binanceApiKeysInputInvalid, setBinanceApiKeysInputInvalid,
        binanceUserData, setBinanceUserData,
        binanceUserDataLoading, setBinanceUserDataLoading,
    }
) {

    function onCancelClicked() {
        stateReset()
    }

    function buildDefaultView() {
        return (<>
            <div className={"setting-label text-label"}>Configure integration</div>
            <div className="integration-settings">{
                [
                    {integration: binanceIntegration, isEnabled: binanceSettingsEnabled},
                    {integration: qmallIntegration, isEnabled: false},
                    {integration: monobankIntegration, isEnabled: monobankSettingsEnabled},

                ].map(({integration, isEnabled}) => integration.element(
                    () => setIntegrationWindowNameSelected(integration.name), isEnabled)
                )
            }</div>
        </>)
    }

    return IntegrationSettings(
        buildDefaultView,
        true,
        true,
        "Settings",
        onCancelClicked,
        (integrationWindowNameSelected !== null),
        stateReset,
        userData, setUserData,
        monobankSettingsEnabled, setMonobankSettingsEnabled,
        monobankApiTokenInput, setMonobankApiTokenInput,
        monobankApiTokenInputInvalid, setMonobankApiTokenInputInvalid,
        monobankUserData, setMonobankUserData,
        monobankUserDataLoading, setMonobankUserDataLoading,
        integrationWindowNameSelected, setIntegrationWindowNameSelected,
        binanceCurrencies,
        binanceSettingsEnabled, setBinanceSettingsEnabled,
        binanceApiKeyInput, setBinanceApiKeyInput,
        binanceApiSecretInput, setBinanceApiSecretInput,
        binanceApiKeysInputInvalid, setBinanceApiKeysInputInvalid,
        binanceUserData, setBinanceUserData,
        binanceUserDataLoading, setBinanceUserDataLoading,
    );
}
