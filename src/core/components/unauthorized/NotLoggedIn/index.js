import './index.css';
import React from "react";
import LogInButton from "../button/LogInButton";
import CreateWalletButton from "../button/CreateWalletButton";
import ImportWalletButton from "../button/ImportWalletButton";
import PositiveButton from "../../buttons/PositiveButton";
import NeutralButton from "../../buttons/NeutralButton";
import {dataImporter} from "../../settings/ImportData";

export default function NotLoggedIn(
    userData, setUserData, importDataBuffer, setImportDataBuffer,
    importOrExportSettingRequested, setImportOrExportSettingRequested,
    loadMonobankUserData, loadBinanceUserData,
    stateReset, setShowCreateNewAssetWindow, setCreatingNewAsset,
) {
    function buildImportPad() {
        return (
            <div className="import-box  flex-box-centered flex-direction-column">
                <textarea placeholder={"Copy text from 'Export'"}
                          onChange={event => setImportDataBuffer(event.target.value)}
                          style={{resize: 'none'}}
                          className={"import-text-area"}/>
                <div className="import-box--controls flex-box-centered flex-direction-row">
                    <PositiveButton
                        onClick={() => {
                            if (importDataBuffer) {
                                dataImporter.readImportedData(importDataBuffer, setUserData)
                                loadBinanceUserData()
                                loadMonobankUserData()
                            }
                            stateReset()
                            setShowCreateNewAssetWindow(false)
                            setCreatingNewAsset(false)
                        }}
                        className={"import-box--control"}
                    >Import</PositiveButton>
                    <NeutralButton
                        onClick={() => {
                            stateReset()
                        }}
                        className={"import-box--control"}
                    >Cancel</NeutralButton>
                </div>
            </div>
        )
    }

    return (
        <div className={"startup-login-box layer-1-themed-color"}>
            {userData.id
                ? LogInButton()
                : (importOrExportSettingRequested === null ? CreateWalletButton(setUserData) : null)}
            {importOrExportSettingRequested === null
                ? ImportWalletButton(setImportOrExportSettingRequested,)
                : buildImportPad()}
        </div>
    );
}
