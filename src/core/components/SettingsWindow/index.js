import './index.css';
import ModalWindow from "../ModalWindow";
import NeutralButton from "../buttons/NeutralButton";
import React from "react";
import PositiveButton from "../buttons/PositiveButton";
import monobankApiClient from "../../integrations/monobank/monobankApiClient.ts";
import thirdPartyIntegrations from "../integrations/ThirdPartyIntegrations";
import monobankIntegration from "../integrations/MonobankIntegrationPad";
import {UserSettings} from "../../domain/UserData";
import binanceIntegration from "../integrations/BinanceIntegrationPad";
import qmallIntegration from "../integrations/QmallIntegrationPad";
import binanceApiClient from "../../integrations/binance/binanceApiClient";

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

    class SettingsValidationResult {
        tokenInputInvalid = false;

        isValid() {
            return !this.tokenInputInvalid
        }
    }

    async function validateMonobankSettings() {
        const settingsValidationResult = new SettingsValidationResult();

        if (!userData.settings.monobankIntegrationEnabled && monobankSettingsEnabled
            || (monobankSettingsEnabled || userData.settings.monobankIntegrationEnabled)
            && !(userData.settings.monobankIntegrationEnabled && !monobankSettingsEnabled)
            && userData.settings.monobankIntegrationToken
            && userData.settings.monobankIntegrationToken !== monobankApiTokenInput
        ) {
            if (!monobankApiTokenInput) {
                settingsValidationResult.tokenInputInvalid = true;
            } else {
                let response = await monobankApiClient.getUserInfo(monobankApiTokenInput);
                if (response.success) {
                    setMonobankUserData(response.result)
                } else {
                    settingsValidationResult.tokenInputInvalid = true;
                }
            }
        }
        return settingsValidationResult;
    }

    async function validateBinanceSettings() {
        const settingsValidationResult = new SettingsValidationResult();

        if (!userData.settings.binanceIntegrationEnabled && binanceSettingsEnabled
            || (binanceSettingsEnabled || userData.settings.binanceIntegrationEnabled)
            && !(userData.settings.binanceIntegrationEnabled && !binanceSettingsEnabled)
            && userData.settings.binanceIntegrationApiKey
            && userData.settings.binanceIntegrationApiSecret
            && userData.settings.binanceIntegrationApiKey !== binanceApiKeyInput
            && userData.settings.binanceIntegrationApiSecret !== binanceApiSecretInput
        ) {
            if (!binanceApiKeyInput || !binanceApiSecretInput) {
                settingsValidationResult.tokenInputInvalid = true;
            } else {
                let accountInfo = await binanceApiClient.getUserInfoAsync(
                    binanceApiKeyInput, binanceApiSecretInput, binanceCurrencies, binanceUserData
                );
                if (accountInfo.account?.balances) {
                    setBinanceUserData(accountInfo)
                } else {
                    settingsValidationResult.tokenInputInvalid = true;
                }
            }
        }
        return settingsValidationResult;
    }

    function onSaveClicked() {
        switch (integrationWindowNameSelected) {
            case monobankIntegration.name:
                return monobankSettingsValidation()
            case binanceIntegration.name:
                return binanceSettingsValidation()
        }
    }

    function binanceSettingsValidation() {
        if (!userData.settings.binanceIntegrationEnabled && binanceSettingsEnabled
            || (binanceSettingsEnabled || userData.settings.binanceIntegrationEnabled)
            && !(userData.settings.binanceIntegrationEnabled && !binanceSettingsEnabled)
            && userData.settings.binanceIntegrationApiKey
            && userData.settings.binanceIntegrationApiSecret
            && userData.settings.binanceIntegrationApiKey !== binanceApiKeyInput
            && userData.settings.binanceIntegrationApiSecret !== binanceApiSecretInput
        ) {
            if (binanceApiKeyInput && binanceApiSecretInput) {
                setBinanceUserDataLoading(true)
            }
        }
        validateBinanceSettings()
            .then(settingsValidationResult => {
                if (settingsValidationResult.isValid()) {
                    const userDataNew = {...userData};
                    let shouldSave = false;
                    if (!userDataNew.settings) {
                        userDataNew.settings = new UserSettings();
                    }
                    if (binanceSettingsEnabled !== null
                        && userDataNew.settings.binanceIntegrationEnabled !== binanceSettingsEnabled
                    ) {
                        userDataNew.settings.binanceIntegrationEnabled = binanceSettingsEnabled;
                        shouldSave = true;
                    }
                    if (binanceApiKeyInput !== null
                        && userDataNew.settings.binanceIntegrationApiKey !== binanceApiKeyInput
                    ) {
                        userDataNew.settings.binanceIntegrationApiKey = binanceApiKeyInput;
                        shouldSave = true;
                    }
                    if (binanceApiSecretInput !== null
                        && userDataNew.settings.binanceIntegrationApiSecret !== binanceApiSecretInput
                    ) {
                        userDataNew.settings.binanceIntegrationApiSecret = binanceApiSecretInput;
                        shouldSave = true;
                    }
                    if (shouldSave) {
                        setUserData(userDataNew);
                    }
                    stateReset();
                } else {
                    if (settingsValidationResult.tokenInputInvalid) {
                        setBinanceApiKeysInputInvalid(true)
                        setBinanceUserDataLoading(false)
                    }
                }
            })
            .catch(reason => {
                console.info(reason)
            })
    }

    function monobankSettingsValidation() {
        if (!userData.settings.monobankIntegrationEnabled && monobankSettingsEnabled
            || (monobankSettingsEnabled || userData.settings.monobankIntegrationEnabled)
            && !(userData.settings.monobankIntegrationEnabled && !monobankSettingsEnabled)
            && userData.settings.monobankIntegrationToken
            && userData.settings.monobankIntegrationToken !== monobankApiTokenInput
        ) {
            if (monobankApiTokenInput) {
                setMonobankUserDataLoading(true)
            }
        }
        validateMonobankSettings()
            .then(settingsValidationResult => {
                if (settingsValidationResult.isValid()) {
                    const userDataNew = {...userData};
                    let shouldSave = false;
                    if (!userDataNew.settings) {
                        userDataNew.settings = new UserSettings();
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
                    if (settingsValidationResult.tokenInputInvalid) {
                        setMonobankApiTokenInputInvalid(true)
                        setMonobankUserDataLoading(false)
                    }
                }
            })
            .catch(reason => {
                console.info(reason)
            })
    }

    function QmallSettings() {
        return (
            <></>
        )
    }

    function BinanceSettings() {
        return (
            <div className="setting-unit flex-box flex-direction-column">
                <div className="settings-go-back-row text-label pad layer-3-themed-color"
                     onClick={() => setIntegrationWindowNameSelected(null)}>
                    {"<< Go back"}
                </div>
                <div className="settings-checkbox-row">
                    <label className="text-label clickable"><input
                        type="checkbox"
                        defaultChecked={showBinanceSettings}
                        onChange={event =>
                            setBinanceSettingsEnabled(event.target.checked)
                        }
                    />&nbsp;<span>Enable binance integration</span></label>
                </div>
                <div className="setting-box layer-3-themed-color flex-box flex-direction-column">
                    <div className={"setting-row flex-box-centered flex-direction-row"}>
                        <input type="text"
                               disabled={!binanceSettingsEnabled}
                               placeholder="binance API key"
                               className={"setting-binance-token-input"
                                   + (binanceApiKeysInputInvalid ? " invalid" : "")}
                               onChange={event => {
                                   setBinanceApiKeyInput(event.target.value)
                                   setBinanceApiKeysInputInvalid(false)
                               }}
                               defaultValue={userData.settings.binanceIntegrationApiKey}
                        />
                    </div>
                    <div className={"setting-row flex-box-centered flex-direction-row"}>
                        <input type="text"
                               disabled={!binanceSettingsEnabled}
                               placeholder="binance API secret"
                               className={"setting-binance-token-input"
                                   + (binanceApiKeysInputInvalid ? " invalid" : "")}
                               onChange={event => {
                                   setBinanceApiSecretInput(event.target.value)
                                   setBinanceApiKeysInputInvalid(false)
                               }}
                               defaultValue={userData.settings.binanceIntegrationApiSecret}
                        />
                    </div>
                    {binanceUserDataLoading ? <progress className={"setting-row-progress"}/> : null}
                    <div className="setting-integration-info">
                        <a href="https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072"
                           target="new-window">How to get binance API keys</a>
                    </div>
                </div>
            </div>
        )
    }

    function MonobankSettings() {
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
                               defaultValue={userData.settings.monobankIntegrationToken}
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

    function buildWindowContent() {
        switch (integrationWindowNameSelected) {
            case monobankIntegration.name:
                return MonobankSettings()
            case binanceIntegration.name:
                return BinanceSettings()
            case qmallIntegration.name:
                return QmallSettings()
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
