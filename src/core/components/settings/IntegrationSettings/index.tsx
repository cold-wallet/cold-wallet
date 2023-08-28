import './index.css';
import React, {Dispatch, JSX, SetStateAction} from "react";
import ModalWindow from "./../../ModalWindow";
import PositiveButton from "./../../buttons/PositiveButton";
import NeutralButton from "./../../buttons/NeutralButton";
import monobankIntegration from "./../../integrations/MonobankIntegrationPad";
import MonobankSettings from "./.././MonobankSettings";
import binanceIntegration from "./../../integrations/BinanceIntegrationPad";
import BinanceSettings from "./.././BinanceSettings";
import okxIntegration from "./../../integrations/OkxIntegrationPad";
import OkxSettings from "../OkxSettings";
import monobankSettingsValidation from "./.././MonobankSettings/monobankSettingsValidation";
import binanceSettingsValidation from "./.././BinanceSettings/binanceSettingsValidation";
import UserData from "./../../../domain/UserData";
import {AccountInfo} from "../../../integrations/binance/binanceApiClient";
import BinanceCurrencyResponse from "./../../../integrations/binance/BinanceCurrencyResponse";
import MonobankUserData from "../../../integrations/monobank/MonobankUserData";
import okxSettingsValidation from "../OkxSettings/okxSettingsValidation";
import OkxCurrencyResponse from "../../../integrations/okx/OkxCurrencyResponse";
import {OkxAccount} from "../../../integrations/okx/okxApiClient";

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
    monobankUserData: MonobankUserData, setMonobankUserData: Dispatch<SetStateAction<MonobankUserData | null>>,
    monobankUserDataLoading: boolean, setMonobankUserDataLoading: Dispatch<SetStateAction<boolean | null>>,

    integrationWindowNameSelected: string, setIntegrationWindowNameSelected: Dispatch<SetStateAction<string | null>>,

    binanceCurrencies: { [index: string]: BinanceCurrencyResponse },
    binanceSettingsEnabled: boolean, setBinanceSettingsEnabled: Dispatch<SetStateAction<boolean | null>>,
    binanceApiKeyInput: string, setBinanceApiKeyInput: Dispatch<SetStateAction<string | null>>,
    binanceApiSecretInput: string, setBinanceApiSecretInput: Dispatch<SetStateAction<string | null>>,
    binanceApiKeysInputInvalid: boolean, setBinanceApiKeysInputInvalid: Dispatch<SetStateAction<boolean | null>>,
    binanceUserData: AccountInfo, setBinanceUserData: Dispatch<SetStateAction<AccountInfo | null>>,
    binanceUserDataLoading: boolean, setBinanceUserDataLoading: Dispatch<SetStateAction<boolean | null>>,
    okxCurrencies: { [index: string]: OkxCurrencyResponse },
    okxSettingsEnabled: boolean, setOkxSettingsEnabled: Dispatch<SetStateAction<boolean | null>>,
    okxApiKeyInput: string, setOkxApiKeyInput: Dispatch<SetStateAction<string | null>>,
    okxApiSecretInput: string, setOkxApiSecretInput: Dispatch<SetStateAction<string | null>>,
    okxApiPassPhraseInput: string, setOkxApiPassPhraseInput: Dispatch<SetStateAction<string | null>>,
    okxApiSubAccountNameInput: string, setOkxApiSubAccountNameInput: Dispatch<SetStateAction<string | null>>,
    okxApiKeysInputInvalid: boolean, setOkxApiKeysInputInvalid: Dispatch<SetStateAction<boolean | null>>,
    okxUserData: OkxAccount, setOkxUserData: Dispatch<SetStateAction<OkxAccount | null>>,
    okxUserDataLoading: boolean, setOkxUserDataLoading: Dispatch<SetStateAction<boolean | null>>,
) {

    const showMonobankSettings = userData.settings.monobankIntegrationEnabled || monobankSettingsEnabled;
    const showBinanceSettings = userData.settings.binanceIntegrationEnabled || binanceSettingsEnabled;
    const showOkxSettings = userData.settings.okxIntegrationEnabled || okxSettingsEnabled;

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
            case okxIntegration.name:
                return okxSettingsValidation(
                    userData, setUserData,
                    okxSettingsEnabled,
                    okxApiKeyInput,
                    okxApiSecretInput,
                    okxApiPassPhraseInput,
                    okxApiSubAccountNameInput,
                    setOkxApiKeysInputInvalid,
                    setOkxUserDataLoading,
                    okxCurrencies,
                    okxUserData, setOkxUserData,
                    stateReset,
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
                    binanceSettingsEnabled, setBinanceSettingsEnabled,
                    setBinanceApiKeyInput,
                    setBinanceApiSecretInput,
                    binanceApiKeysInputInvalid, setBinanceApiKeysInputInvalid,
                    binanceUserDataLoading,
                )
            case okxIntegration.name:
                return OkxSettings(
                    userData,
                    setIntegrationWindowNameSelected,
                    showOkxSettings,
                    okxSettingsEnabled, setOkxSettingsEnabled,
                    setOkxApiKeyInput,
                    setOkxApiSecretInput,
                    setOkxApiPassPhraseInput,
                    setOkxApiSubAccountNameInput,
                    okxApiKeysInputInvalid, setOkxApiKeysInputInvalid,
                    okxUserDataLoading,
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
