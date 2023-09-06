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
import Props from "../../Props";

export default function SettingsWindow(props: Props) {

    function onCancelClicked() {
        props.stateReset()
    }

    function buildDefaultView() {
        return (<>
            <div className={"setting-label text-label"}>Configure integrations with third-party services</div>
            <div className="integration-settings">{
                [
                    {integration: binanceIntegration, isEnabled: props.binanceSettingsEnabled},
                    {integration: okxIntegration, isEnabled: props.okxSettingsEnabled},
                    {integration: monobankIntegration, isEnabled: props.monobankSettingsEnabled},

                ].map(({integration, isEnabled}) => integration.element(
                    () => props.setIntegrationWindowNameSelected(integration.name), isEnabled)
                )
            }</div>
            <div className={"setting-label text-label"}>Assets data import/export</div>
            <div className={"choose-setting--row flex-box"}>
                <div
                    onClick={() => props.setImportOrExportSettingRequested('export')}
                    className="choose-setting--setting pad layer-3-themed-color">Export
                </div>
                <div
                    onClick={() => props.setImportOrExportSettingRequested('import')}
                    className="choose-setting--setting pad layer-3-themed-color">Import
                </div>
            </div>
            <div className={"setting-label text-label"}>Security options</div>
            <div className={"choose-setting--row flex-box"}>
                <div
                    onClick={() => props.setPinCodeSettingsRequested(true)}
                    className="choose-setting--setting pad layer-3-themed-color">
                    {(props.userData.settings.pinCode ? 'Change' : 'Add') + ' PIN-code'}
                </div>
                {props.userData.settings.pinCode ? <div
                    onClick={() => {
                        if (props.userData.settings.pinCode) {
                            props.setDeletePinCodeRequested(true)
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

    const showMonobankSettings = props.userData.settings.monobankIntegrationEnabled || props.monobankSettingsEnabled;
    const showBinanceSettings = props.userData.settings.binanceIntegrationEnabled || props.binanceSettingsEnabled;
    const showOkxSettings = props.userData.settings.okxIntegrationEnabled || props.okxSettingsEnabled;

    function onSaveClicked() {
        if (props.integrationWindowNameSelected) {
            switch (props.integrationWindowNameSelected) {
                case monobankIntegration.name:
                    return monobankSettingsValidation(props)
                case binanceIntegration.name:
                    return binanceSettingsValidation(props)
                case okxIntegration.name:
                    return okxSettingsValidation(props)
                default: {
                    console.warn("should never happen")
                    return ""
                }
            }
        } else if (props.importOrExportSettingRequested) {
            switch (props.importOrExportSettingRequested) {
                case 'import': {
                    if (props.importDataBuffer) {
                        dataImporter.readImportedData(props.importDataBuffer, props.setUserDataHolder)
                        props.loadBinanceUserData();
                        props.loadMonobankUserData();
                        props.loadOkxUserData();
                        props.stateReset();
                    }
                    break
                }
                default: {
                    console.warn("should never happen")
                    return ""
                }
            }
        } else {
            props.stateReset()
        }
    }

    function buildWindowContent() {
        if (props.integrationWindowNameSelected) {
            switch (props.integrationWindowNameSelected) {
                case monobankIntegration.name:
                    return MonobankSettings(props)
                case binanceIntegration.name:
                    return BinanceSettings(props)
                case okxIntegration.name:
                    return OkxSettings(props)
                default: {
                    console.warn("should never happen")
                    return ""
                }
            }
        } else if (props.importOrExportSettingRequested) {
            switch (props.importOrExportSettingRequested) {
                default: {
                    console.warn("should never happen")
                    return ""
                }
                case 'import': {
                    return <div className="setting-unit flex-box flex-direction-column">
                        <div className="settings-go-back-row text-label pad layer-3-themed-color"
                             onClick={() => props.setImportOrExportSettingRequested(null)}>
                            {"<< Go back"}
                        </div>
                        <div className={"setting-row flex-box-start flex-direction-column"}>
                            <div className={"text-label"}>Import</div>
                        </div>
                        <div className={"setting-row flex-box-start flex-direction-column"}>
                            <textarea placeholder={"Copy text from 'Export'"}
                                      onChange={event => props.setImportDataBuffer(event.target.value)}
                                      style={{resize: 'none'}}
                                      className={"export-text-area"}/>
                        </div>
                    </div>
                }
                case 'export': {
                    return <div className="setting-unit flex-box flex-direction-column">
                        <div className="settings-go-back-row text-label pad layer-3-themed-color"
                             onClick={() => props.setImportOrExportSettingRequested(null)}>
                            {"<< Go back"}
                        </div>
                        <div className={"setting-row flex-box-start flex-direction-column"}>
                            <div className={"text-label"}>Export</div>
                        </div>
                        <div className={"setting-row flex-box-start flex-direction-column"}>
                            <textarea readOnly={true}
                                      value={dataImporter.generateExportData(props.userDataHolder)}
                                      style={{resize: 'none'}}
                                      className={"export-text-area"}/>
                        </div>
                    </div>
                }
            }
        } else if (props.pinCodeSettingsRequested || props.deletePinCodeRequested) {
            return <PinCodeSetting props={props}/>
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
        bottom={(props.integrationWindowNameSelected !== null || props.importOrExportSettingRequested === 'import') ? <>
            <PositiveButton onClick={onSaveClicked}
                            className="settings-window-bottom-button">Save
            </PositiveButton>
            <NeutralButton onClick={onCancelClicked}
                           className="settings-window-bottom-button">Cancel
            </NeutralButton>
        </> : null}
    />
}
