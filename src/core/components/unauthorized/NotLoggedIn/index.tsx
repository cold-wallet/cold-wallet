import './index.css';
import React from "react";
import CreateWalletButton from "../button/CreateWalletButton";
import InitDemoModeButton from "../button/InitDemoModeButton";
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
                    {CreateWalletButton(props)}
                    {InitDemoModeButton(props)}
                    {ImportWalletButton(props)}
                    {buildAgreeWithPolicyCheckbox(props)}
                </>
                : buildImportPad(props)}
        </div>
    );
}

function buildAgreeWithPolicyCheckbox(props: Props) {
    return (
        <div className="agree-with-policy--box">
            <label className={"clickable"}>
                <input className={"agree-with-policy--checkbox"}
                       checked={props.termsAndPolicyAgreed}
                       onChange={e => props.setTermsAndPolicyAgreed(e.target.checked)}
                       type={"checkbox"}/>
                &nbsp;
                <span className={"agree-with-policy--label"}>
                    I have read and accept&nbsp;
                    <a href="/terms">Terms of Use</a>&nbsp;
                    and <a href="/privacy-policy">Privacy Policy</a>
                </span>
            </label>
        </div>
    )
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
