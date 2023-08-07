import './index.css';
import ModalWindow from "../../ModalWindow";
import NeutralButton from "../../buttons/NeutralButton";
import React from "react";
import PositiveButton from "../../buttons/PositiveButton";
import thirdPartyIntegrations from "../../integrations/ThirdPartyIntegrations";
import monobankIntegration from "../../integrations/MonobankIntegrationPad";
import binanceIntegration from "../../integrations/BinanceIntegrationPad";
import qmallIntegration from "../../integrations/QmallIntegrationPad";
import MonobankSettings from "../MonobankSettings";
import BinanceSettings from "../BinanceSettings";
import QmallSettings from "../QmallSettings";
import monobankSettingsValidation from "../MonobankSettings/monobankSettingsValidation";
import binanceSettingsValidation from "../BinanceSettings/binanceSettingsValidation";

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

    const showMonobankSettings = userData.settings.monobankIntegrationEnabled || monobankSettingsEnabled;
    const showBinanceSettings = userData.settings.binanceIntegrationEnabled || binanceSettingsEnabled;

    function onSaveClicked() {
        switch (integrationWindowNameSelected) {
            case monobankIntegration.name:
                return monobankSettingsValidation(
                    userData,
                    setUserData,
                    stateReset,
                    setMonobankApiTokenInputInvalid,
                    monobankSettingsEnabled,
                    monobankApiTokenInput,
                    setMonobankUserData,
                    setMonobankUserDataLoading,
                )
            case binanceIntegration.name:
                return binanceSettingsValidation(
                    userData,
                    setUserData,
                    binanceSettingsEnabled,
                    binanceApiKeyInput,
                    binanceApiSecretInput,
                    setBinanceUserDataLoading,
                    stateReset,
                    setBinanceApiKeysInputInvalid,
                    binanceCurrencies,
                    binanceUserData,
                    setBinanceUserData,
                )
            default:
                stateReset()
        }
    }

    function buildWindowContent() {
        switch (integrationWindowNameSelected) {
            case monobankIntegration.name:
                return MonobankSettings(
                    userData,
                    setIntegrationWindowNameSelected,
                    showMonobankSettings,
                    monobankSettingsEnabled,
                    setMonobankSettingsEnabled,
                    monobankApiTokenInputInvalid,
                    setMonobankApiTokenInputInvalid,
                    setMonobankApiTokenInput,
                    monobankUserDataLoading,
                )
            case binanceIntegration.name:
                return BinanceSettings(
                    userData,
                    setIntegrationWindowNameSelected,
                    showBinanceSettings,
                    binanceSettingsEnabled,
                    setBinanceSettingsEnabled,
                    setBinanceApiKeyInput,
                    setBinanceApiSecretInput,
                    binanceApiKeysInputInvalid,
                    setBinanceApiKeysInputInvalid,
                    binanceUserDataLoading,
                )
            case qmallIntegration.name:
                return QmallSettings(
                    userData,
                    setIntegrationWindowNameSelected,
                )
            default:
                return (<>
                    <div className={"setting-label text-label"}>Configure integration</div>
                    <div className="integration-settings">{
                        thirdPartyIntegrations.map(integration => integration.element(
                            () => setIntegrationWindowNameSelected(integration.name)
                        ))
                    }</div>
                </>)
        }
    }

    return (
        <ModalWindow
            closeable={true}
            large={true}
            onCancel={stateReset}
            title={"Settings"}
            children={
                <div className="settings-box">{buildWindowContent()}</div>
            }
            bottom={integrationWindowNameSelected !== null ? <>
                <PositiveButton onClick={onSaveClicked}
                                className="settings-window-bottom-button">Save
                </PositiveButton>
                <NeutralButton onClick={onCancelClicked}
                               className="settings-window-bottom-button">Cancel
                </NeutralButton>
            </> : null}
        />
    )
}
