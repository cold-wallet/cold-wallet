import './index.css';
import React from "react";
import monobankIntegration from "../../integrations/MonobankIntegrationPad";
import binanceIntegration from "../../integrations/BinanceIntegrationPad";
import okxIntegration from "../../integrations/OkxIntegrationPad";
import monobankSettingsValidation from "../MonobankSettings/monobankSettingsValidation";
import binanceSettingsValidation from "../BinanceSettings/binanceSettingsValidation";
import MonobankSettings from "../MonobankSettings";
import BinanceSettings from "../BinanceSettings";
import OkxSettings from "../OkxSettings";
import PositiveButton from "../../buttons/PositiveButton";
import NeutralButton from "../../buttons/NeutralButton";
import ModalWindow from "../../ModalWindow";
import {dataImporter} from "../ImportData";
import PinCodeSetting from "../PinCode";
import okxSettingsValidation from "../OkxSettings/okxSettingsValidation";

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

        okxCurrencies,
        okxSettingsEnabled, setOkxSettingsEnabled,
        okxApiKeyInput, setOkxApiKeyInput,
        okxApiSecretInput, setOkxApiSecretInput,
        okxApiPassPhraseInput, setOkxApiPassPhraseInput,
        okxApiSubAccountNameInput, setOkxApiSubAccountNameInput,
        okxApiKeysInputInvalid, setOkxApiKeysInputInvalid,
        okxUserData, setOkxUserData,
        okxUserDataLoading, setOkxUserDataLoading,

        importOrExportSettingRequested, setImportOrExportSettingRequested,
        importDataBuffer, setImportDataBuffer,
        loadMonobankUserData, loadBinanceUserData, loadOkxUserData,

        pinCodeSettingsRequested, setPinCodeSettingsRequested,
        pinCodeEntered, setPinCodeEntered,
        pinCodeEnteringFinished, setPinCodeEnteringFinished,
        pinCodeRepeatEntered, setPinCodeRepeatEntered,
        invalidPinCode, setInvalidPinCode,
        currentPinCodeConfirmed, setCurrentPinCodeConfirmed,
        deletePinCodeRequested, setDeletePinCodeRequested,
    }
) {

    function onCancelClicked() {
        stateReset()
    }

    function buildDefaultView() {
        return (<>
            <div className={"setting-label text-label"}>Configure integrations with third-party services</div>
            <div className="integration-settings">{
                [
                    {integration: binanceIntegration, isEnabled: binanceSettingsEnabled},
                    {integration: okxIntegration, isEnabled: false},
                    {integration: monobankIntegration, isEnabled: monobankSettingsEnabled},

                ].map(({integration, isEnabled}) => integration.element(
                    () => setIntegrationWindowNameSelected(integration.name), isEnabled)
                )
            }</div>
            <div className={"setting-label text-label"}>Assets data import/export</div>
            <div className={"choose-setting--row flex-box"}>
                <div
                    onClick={() => setImportOrExportSettingRequested('export')}
                    className="choose-setting--setting pad layer-3-themed-color">Export
                </div>
                <div
                    onClick={() => setImportOrExportSettingRequested('import')}
                    className="choose-setting--setting pad layer-3-themed-color">Import
                </div>
            </div>
            <div className={"setting-label text-label"}>Security options</div>
            <div className={"choose-setting--row flex-box"}>
                <div
                    onClick={() => setPinCodeSettingsRequested(true)}
                    className="choose-setting--setting pad layer-3-themed-color">
                    {(userData.settings.pinCode ? 'Change' : 'Add') + ' PIN-code'}
                </div>
                {userData.settings.pinCode ? <div
                    onClick={() => {
                        if (userData.settings.pinCode) {
                            setDeletePinCodeRequested(true)
                        }
                    }}
                    className={"choose-setting--setting pad layer-3-themed-color"}>Delete PIN-code
                </div> : null}
            </div>
            <div className={"setting-separate-line"}></div>
            <div className={"choose-setting--row flex-box"}>
                <div
                    onClick={() => {
                    }}
                    title={"coming soon"}
                    className="choose-setting--setting pad layer-3-themed-color disabled">
                    Add pass-phrase (coming soon)
                </div>
                <div
                    onClick={() => {
                    }}
                    title={"coming soon"}
                    className="choose-setting--setting pad layer-3-themed-color disabled">
                    Add second factor authentication (coming soon)
                </div>
            </div>
        </>)
    }

    const showMonobankSettings = userData.settings.monobankIntegrationEnabled || monobankSettingsEnabled;
    const showBinanceSettings = userData.settings.binanceIntegrationEnabled || binanceSettingsEnabled;
    const showOkxSettings = userData.settings.okxIntegrationEnabled || okxSettingsEnabled;

    function onSaveClicked() {
        if (integrationWindowNameSelected) {
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
                case okxIntegration.name:
                    return okxSettingsValidation(
                        userData, setUserData,
                        okxSettingsEnabled,
                        okxApiKeyInput,
                        okxApiSecretInput,
                        okxApiPassPhraseInput,
                        okxApiSubAccountNameInput,
                        setOkxApiKeysInputInvalid,
                        setOkxUserDataLoading,
                        okxCurrencies,
                        okxUserData, setOkxUserData,
                        stateReset,
                    )
            }
        } else if (importOrExportSettingRequested) {
            switch (importOrExportSettingRequested) {
                case 'import': {
                    if (importDataBuffer) {
                        dataImporter.readImportedData(importDataBuffer, setUserData)
                        loadBinanceUserData();
                        loadMonobankUserData();
                        loadOkxUserData();
                        stateReset();
                    }
                    break
                }
            }
        } else {
            stateReset()
        }
    }

    function buildWindowContent() {
        if (integrationWindowNameSelected) {
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
                case okxIntegration.name:
                    return OkxSettings(
                        userData,
                        setIntegrationWindowNameSelected,
                        showOkxSettings,
                        okxSettingsEnabled, setOkxSettingsEnabled,
                        setOkxApiKeyInput,
                        setOkxApiSecretInput,
                        setOkxApiPassPhraseInput,
                        setOkxApiSubAccountNameInput,
                        okxApiKeysInputInvalid, setOkxApiKeysInputInvalid,
                        okxUserDataLoading,
                    )
            }
        } else if (importOrExportSettingRequested) {
            switch (importOrExportSettingRequested) {
                case 'import': {
                    return <div className="setting-unit flex-box flex-direction-column">
                        <div className="settings-go-back-row text-label pad layer-3-themed-color"
                             onClick={() => setImportOrExportSettingRequested(null)}>
                            {"<< Go back"}
                        </div>
                        <div className={"setting-row flex-box-start flex-direction-column"}>
                            <div className={"text-label"}>Import</div>
                        </div>
                        <div className={"setting-row flex-box-start flex-direction-column"}>
                            <textarea placeholder={"Copy text from 'Export'"}
                                      onChange={event => setImportDataBuffer(event.target.value)}
                                      style={{resize: 'none'}}
                                      className={"export-text-area"}/>
                        </div>
                    </div>
                }
                case 'export': {
                    return <div className="setting-unit flex-box flex-direction-column">
                        <div className="settings-go-back-row text-label pad layer-3-themed-color"
                             onClick={() => setImportOrExportSettingRequested(null)}>
                            {"<< Go back"}
                        </div>
                        <div className={"setting-row flex-box-start flex-direction-column"}>
                            <div className={"text-label"}>Export</div>
                        </div>
                        <div className={"setting-row flex-box-start flex-direction-column"}>
                            <textarea readOnly={true}
                                      value={dataImporter.generateExportData(userData)}
                                      style={{resize: 'none'}}
                                      className={"export-text-area"}/>
                        </div>
                    </div>
                }
            }
        } else if (pinCodeSettingsRequested || deletePinCodeRequested) {
            return <PinCodeSetting props={{
                userData, setUserData,
                setPinCodeSettingsRequested,
                pinCodeEntered, setPinCodeEntered,
                pinCodeEnteringFinished, setPinCodeEnteringFinished,
                pinCodeRepeatEntered, setPinCodeRepeatEntered,
                invalidPinCode, setInvalidPinCode,
                currentPinCodeConfirmed, setCurrentPinCodeConfirmed,
                deletePinCodeRequested, setDeletePinCodeRequested,
            }}/>
        } else {
            return buildDefaultView()
        }
    }

    return <ModalWindow
        closeable={true}
        large={true}
        onCancel={onCancelClicked}
        title={"Settings"}
        children={
            <div className="settings-box">{buildWindowContent()}</div>
        }
        bottom={(integrationWindowNameSelected !== null || importOrExportSettingRequested === 'import') ? <>
            <PositiveButton onClick={onSaveClicked}
                            className="settings-window-bottom-button">Save
            </PositiveButton>
            <NeutralButton onClick={onCancelClicked}
                           className="settings-window-bottom-button">Cancel
            </NeutralButton>
        </> : null}
    />
}
