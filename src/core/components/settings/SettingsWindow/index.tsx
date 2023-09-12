import './index.css';
import React from "react";
import monobankIntegration from "../../integrations/MonobankIntegrationPad";
import binanceIntegration from "../../integrations/BinanceIntegrationPad";
import okxIntegration from "../../integrations/OkxIntegrationPad";
import PositiveButton from "../../buttons/PositiveButton";
import NeutralButton from "../../buttons/NeutralButton";
import ModalWindow from "../../ModalWindow";
import {dataImporter} from "../ImportData";
import PinCodeSetting from "../PinCode";
import Props from "../../Props";
import {buildSettingContent, onSaveSetting} from "../IntegrationSettings";
import SettingUnit from "../SettingUnit";
import SelectIntegration from "../../integrations/SelectIntegration";

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
                    () => props.setIntegrationWindowNameSelected(integration.name), isEnabled
                ))
            }
                <SelectIntegration onSelect={props.setIntegrationWindowNameSelected}/>
            </div>
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

    function onSaveClicked(props: Props) {
        if (props.integrationWindowNameSelected) {
            onSaveSetting(props, () => console.warn("should never happen"))

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
                }
            }
        } else {
            props.stateReset()
        }
    }

    function buildWindowContent() {
        if (props.integrationWindowNameSelected) {
            return buildSettingContent(props, () => {
                console.warn("should never happen")
                return <></>
            })
        } else if (props.importOrExportSettingRequested) {
            switch (props.importOrExportSettingRequested) {
                default: {
                    console.warn("should never happen")
                    return ""
                }
                case 'import':
                    return SettingUnit(
                        () => props.setImportOrExportSettingRequested(null),
                        <>
                            <div className={"setting-row flex-box-start flex-direction-column"}>
                                <div className={"text-label"}>Import</div>
                            </div>
                            <div className={"setting-row flex-box-start flex-direction-column"}>
                                <textarea placeholder={"Copy text from 'Export'"}
                                          onChange={event => props.setImportDataBuffer(event.target.value)}
                                          style={{resize: 'none'}}
                                          className={"export-text-area"}/>
                            </div>
                        </>
                    )
                case 'export':
                    return SettingUnit(
                        () => props.setImportOrExportSettingRequested(null),
                        <>
                            <div className={"setting-row flex-box-start flex-direction-column"}>
                                <div className={"text-label"}>Export</div>
                            </div>
                            <div className={"setting-row flex-box-start flex-direction-column"}>
                                <textarea readOnly={true}
                                          value={dataImporter.generateExportData(props.userDataHolder)}
                                          style={{resize: 'none'}}
                                          className={"export-text-area"}/>
                            </div>
                        </>
                    )
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
            <PositiveButton onClick={() => onSaveClicked(props)}
                            className="settings-window-bottom-button">Save
            </PositiveButton>
            <NeutralButton onClick={onCancelClicked}
                           className="settings-window-bottom-button">Cancel
            </NeutralButton>
        </> : null}
    />
}
