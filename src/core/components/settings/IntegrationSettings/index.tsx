import './index.css';
import React, {Dispatch, JSX, SetStateAction} from "react";
import ModalWindow from "./../../ModalWindow";
import PositiveButton from "./../../buttons/PositiveButton";
import NeutralButton from "./../../buttons/NeutralButton";
import monobankIntegration from "./../../integrations/MonobankIntegrationPad";
import MonobankSettings from "./.././MonobankSettings";
import binanceIntegration from "./../../integrations/BinanceIntegrationPad";
import BinanceSettings from "./.././BinanceSettings";
import qmallIntegration from "./../../integrations/QmallIntegrationPad";
import QmallSettings from "./.././QmallSettings";
import monobankSettingsValidation from "./.././MonobankSettings/monobankSettingsValidation";
import binanceSettingsValidation from "./.././BinanceSettings/binanceSettingsValidation";
import UserData from "./../../../domain/UserData";
import MonobankUserDataResponse from "./../../../integrations/monobank/MonobankUserDataResponse";
import {AccountInfo} from "../../../integrations/binance/binanceApiClient";
import BinanceCurrencyResponse from "./../../../integrations/binance/BinanceCurrencyResponse";

export default function IntegrationSettings(
    defaultViewBuilder: () => JSX.Element,
    closeable: boolean,
    large: boolean,
    title: string,
    onClose: () => void,
    withBottom: boolean,
    stateReset: () => void,
    userData: UserData, setUserData: Dispatch<SetStateAction<UserData | null>>,
    monobankSettingsEnabled: boolean, setMonobankSettingsEnabled: Dispatch<SetStateAction<boolean | null>>,
    monobankApiTokenInput: string, setMonobankApiTokenInput: Dispatch<SetStateAction<string | null>>,
    monobankApiTokenInputInvalid: boolean, setMonobankApiTokenInputInvalid: Dispatch<SetStateAction<boolean | null>>,
    monobankUserData: MonobankUserDataResponse, setMonobankUserData: Dispatch<SetStateAction<MonobankUserDataResponse | null>>,
    monobankUserDataLoading: boolean, setMonobankUserDataLoading: Dispatch<SetStateAction<boolean | null>>,
    integrationWindowNameSelected: string, setIntegrationWindowNameSelected: Dispatch<SetStateAction<string | null>>,
    binanceCurrencies: { [index: string]: BinanceCurrencyResponse },
    binanceSettingsEnabled: boolean, setBinanceSettingsEnabled: Dispatch<SetStateAction<boolean | null>>,
    binanceApiKeyInput: string, setBinanceApiKeyInput: Dispatch<SetStateAction<string | null>>,
    binanceApiSecretInput: string, setBinanceApiSecretInput: Dispatch<SetStateAction<string | null>>,
    binanceApiKeysInputInvalid: boolean, setBinanceApiKeysInputInvalid: Dispatch<SetStateAction<boolean | null>>,
    binanceUserData: AccountInfo, setBinanceUserData: Dispatch<SetStateAction<AccountInfo | null>>,
    binanceUserDataLoading: boolean, setBinanceUserDataLoading: Dispatch<SetStateAction<boolean | null>>,
) {

    const showMonobankSettings = userData.settings.monobankIntegrationEnabled || monobankSettingsEnabled;
    const showBinanceSettings = userData.settings.binanceIntegrationEnabled || binanceSettingsEnabled;

    function onSaveClicked() {
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
            default:
                stateReset()
        }
    }

    function buildWindowContent() {
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
            case qmallIntegration.name:
                return QmallSettings(
                    userData,
                    setIntegrationWindowNameSelected,
                )
            default:
                return defaultViewBuilder()
        }
    }

    return (
        <ModalWindow
            closeable={closeable}
            large={large}
            onCancel={onClose}
            title={title}
            children={
                <div className="settings-box">{buildWindowContent()}</div>
            }
            bottom={withBottom ? <>
                <PositiveButton onClick={onSaveClicked}
                                className="settings-window-bottom-button">Save
                </PositiveButton>
                <NeutralButton onClick={onClose}
                               className="settings-window-bottom-button">Cancel
                </NeutralButton>
            </> : null}
        />
    )
}
