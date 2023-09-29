import Props from "../../Props";
import React from "react";
import SettingUnit from "../SettingUnit";

export default function MetaMaskSettings(props: Props) {
    const {
        metaMaskHasProvider,
        metaMaskIsConnecting,
        metaMaskHandleConnect,
        metaMaskIsError,
        metaMaskErrorMessage,
    } = props

    return SettingUnit(
        () => props.setIntegrationWindowNameSelected(null),
        <>
            <div className="settings-checkbox-row">
                <label className={`text-label ${metaMaskHasProvider ? 'clickable' : ' disabled'} `}><input
                    type="checkbox"
                    disabled={!metaMaskHasProvider}
                    defaultChecked={props.metaMaskSettingsEnabled}
                    onChange={event => {
                        if (event.target.checked) {
                            metaMaskHandleConnect().then(() =>
                                props.setMetaMaskSettingsEnabled(event.target.checked)
                            )
                        } else {
                            props.setMetaMaskSettingsEnabled(event.target.checked)
                        }
                    }}
                />&nbsp;<span>Enable MetaMask integration</span></label>
            </div>
            <div className="setting-box layer-3-themed-color flex-box flex-direction-column">
                {metaMaskHasProvider ? null : <a href="https://metamask.io" target="_blank">
                    Install MetaMask
                </a>}

                {props.userData.settings?.metaMask?.accounts
                    && Object.keys(props.userData.settings.metaMask.accounts || {}).length > 0
                    && <div>Wallet address: {Object.keys(props.userData.settings.metaMask.accounts)[0]}</div>
                }
                {metaMaskIsError && (
                    <div>
                        <strong>Error:</strong> {metaMaskErrorMessage}
                    </div>
                )}
                {metaMaskIsConnecting ? <progress className={"setting-row-progress"}/> : null}
            </div>
        </>
    )
}
