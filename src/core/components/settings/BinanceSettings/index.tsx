import './index.css'
import React from "react";
import Props from "../../Props";

export default function BinanceSettings(props: Props) {
    const showBinanceSettings = props.userData.settings.binanceIntegrationEnabled || props.binanceSettingsEnabled;
    return (
        <div className="setting-unit flex-box flex-direction-column">
            <div className="settings-go-back-row text-label pad layer-3-themed-color"
                 onClick={() => props.setIntegrationWindowNameSelected(null)}>
                {"<< Go back"}
            </div>
            <div className="settings-checkbox-row">
                <label className="text-label clickable"><input
                    type="checkbox"
                    defaultChecked={showBinanceSettings}
                    onChange={event =>
                        props.setBinanceSettingsEnabled(event.target.checked)
                    }
                />&nbsp;<span>Enable binance integration</span></label>
            </div>
            <div className="setting-box layer-3-themed-color flex-box flex-direction-column">
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={!props.binanceSettingsEnabled}
                           placeholder="binance API key"
                           className={"setting-binance-token-input"
                               + (props.binanceApiKeysInputInvalid ? " invalid" : "")}
                           onChange={event => {
                               props.setBinanceApiKeyInput(event.target.value)
                               props.setBinanceApiKeysInputInvalid(false)
                           }}
                           defaultValue={props.userData.settings.binanceIntegrationApiKey || ""}
                    />
                </div>
                <div className={"setting-row flex-box-centered flex-direction-row"}>
                    <input type="text"
                           disabled={!props.binanceSettingsEnabled}
                           placeholder="binance API secret"
                           className={"setting-binance-token-input"
                               + (props.binanceApiKeysInputInvalid ? " invalid" : "")}
                           onChange={event => {
                               props.setBinanceApiSecretInput(event.target.value)
                               props.setBinanceApiKeysInputInvalid(false)
                           }}
                           defaultValue={props.userData.settings.binanceIntegrationApiSecret || ""}
                    />
                </div>
                {props.binanceUserDataLoading ? <progress className={"setting-row-progress"}/> : null}
                <div className="setting-integration-info">
                    <a href="https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072"
                       target="new-window">How to get binance API keys</a>
                </div>
            </div>
        </div>
    )
}
