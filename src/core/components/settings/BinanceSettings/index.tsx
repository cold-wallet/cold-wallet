import './index.css'
import React, {Dispatch, SetStateAction} from "react";
import UserData from "../../../domain/UserData";

export default function BinanceSettings(
    userData: UserData,
    setIntegrationWindowNameSelected: Dispatch<SetStateAction<string | null>>,
    showBinanceSettings: boolean,
    binanceSettingsEnabled: boolean,
    setBinanceSettingsEnabled: Dispatch<SetStateAction<boolean | null>>,
    setBinanceApiKeyInput: Dispatch<SetStateAction<string | null>>,
    setBinanceApiSecretInput: Dispatch<SetStateAction<string | null>>,
    binanceApiKeysInputInvalid: boolean,
    setBinanceApiKeysInputInvalid: Dispatch<SetStateAction<boolean | null>>,
    binanceUserDataLoading: boolean,
) {
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
                           defaultValue={userData.settings.binanceIntegrationApiKey || ""}
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
                           defaultValue={userData.settings.binanceIntegrationApiSecret || ""}
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
