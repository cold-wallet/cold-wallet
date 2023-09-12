import './index.css';
import React from "react";
import CreateWalletButton from "../button/CreateWalletButton";
import ImportWalletButton from "../button/ImportWalletButton";
import PositiveButton from "../../buttons/PositiveButton";
import NeutralButton from "../../buttons/NeutralButton";
import {dataImporter} from "../../settings/ImportData";
import Props from "../../Props";

export default function NotLoggedIn(props: Props) {
    return (
        <div className={"startup-login-box layer-1-themed-color"}>
            {props.importOrExportSettingRequested === null
                ? <>
                    {CreateWalletButton(props.setUserDataHolder,)}
                    {ImportWalletButton(props.setImportOrExportSettingRequested,)}
                </>
                : buildImportPad(props)}
        </div>
    );
}

function buildImportPad(props: Props) {
    return (
        <div className="import-box  flex-box-centered flex-direction-column">
                <textarea placeholder={"Copy text from 'Export'"}
                          onChange={event => props.setImportDataBuffer(event.target.value)}
                          style={{resize: 'none'}}
                          className={"import-text-area"}/>
            <div className="import-box--controls flex-box-centered flex-direction-row">
                <PositiveButton
                    onClick={() => {
                        if (props.importDataBuffer) {
                            dataImporter.readImportedData(props.importDataBuffer, props.setUserDataHolder)
                            props.loadBinanceUserData()
                            props.loadMonobankUserData()
                            props.loadOkxUserData()
                        }
                        props.stateReset()
                        props.setShowCreateNewAssetWindow(false)
                        props.setCreatingNewAsset(false)
                    }}
                    className={"import-box--control"}
                >Import</PositiveButton>
                <NeutralButton
                    onClick={() => {
                        props.stateReset()
                    }}
                    className={"import-box--control"}
                >Cancel</NeutralButton>
            </div>
        </div>
    )
}
