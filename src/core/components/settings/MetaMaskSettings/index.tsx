import Props from "../../Props";
import React from "react";
import SettingUnit from "../SettingUnit";

export default function MetaMaskSettings(props: Props) {
    const settingEnabled = props.userData.settings.metaMask?.enabled || props.metaMaskSettingsEnabled;
    const {
        hasProvider,
        wallet,
        isConnecting,
        handleConnect,
        error, setError,
        errorMessage,
    } = props

    return SettingUnit(
        () => props.setIntegrationWindowNameSelected(null),
        <>
            <div className="settings-checkbox-row">
                <label className={`text-label ${hasProvider ? 'clickable' : ' disabled'} `}><input
                    type="checkbox"
                    disabled={!hasProvider}
                    defaultChecked={settingEnabled && hasProvider}
                    onChange={event =>
                        props.setMetaMaskSettingsEnabled(event.target.checked)
                    }
                />&nbsp;<span>Enable MetaMask integration</span></label>
            </div>
            <div className="setting-box layer-3-themed-color flex-box flex-direction-column">
                {hasProvider ? null : <a href="https://metamask.io" target="_blank">
                    Install MetaMask
                </a>}

                {window.ethereum?.isMetaMask && (!wallet.accounts || wallet.accounts?.length < 1) &&
                    <button disabled={Boolean(wallet) && isConnecting}
                            onClick={handleConnect}>Connect MetaMask</button>
                }

                {wallet.accounts && wallet.accounts.length > 0 &&
                    <>
                        <div>Wallet Accounts: {wallet.accounts[0]}</div>
                        <div>Wallet Balance: {wallet.balance}</div>
                        <div>Hex ChainId: {wallet.chainId}</div>
                        <div>Numeric ChainId: {formatChainAsNum(wallet.chainId)}</div>
                    </>
                }
                {error && (
                    <div onClick={() => setError(false)}>
                        <strong>Error:</strong> {errorMessage}
                    </div>
                )}
                {props.metaMaskSettingsLoading ? <progress className={"setting-row-progress"}/> : null}
            </div>
        </>
    )
}

export const formatChainAsNum = (chainIdHex: string) => {
    return parseInt(chainIdHex)
}
