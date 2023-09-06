import binanceApiClient, {AccountInfo} from "../../../integrations/binance/binanceApiClient";
import {UserSettings} from "../../../domain/UserData";
import {Dispatch, SetStateAction} from "react";
import BinanceCurrencyResponse from "../../../integrations/binance/BinanceCurrencyResponse";
import Props from "../../Props";

async function validateBinanceSettings(
    isPreValid: boolean,
    binanceApiKeyInput: string | null,
    binanceApiSecretInput: string | null,
    binanceCurrencies: { [index: string]: BinanceCurrencyResponse } | null,
    binanceUserData: AccountInfo | null,
    setBinanceUserData: Dispatch<SetStateAction<AccountInfo | null>>,
) {
    let isValidSettings = true;

    if (isPreValid) {
        if (!binanceApiKeyInput || !binanceApiSecretInput) {
            isValidSettings = false;
        } else {
            let accountInfo = await binanceApiClient.getUserInfoAsync(
                binanceApiKeyInput, binanceApiSecretInput, binanceCurrencies, binanceUserData
            );
            if (accountInfo.account?.balances) {
                setBinanceUserData(accountInfo)
            } else {
                isValidSettings = false;
            }
        }
    }
    return isValidSettings;
}

export default function binanceSettingsValidation(props: Props) {
    const isPreValid = (!props.userData.settings.binanceIntegrationEnabled && props.binanceSettingsEnabled)
        || ((props.binanceSettingsEnabled || props.userData.settings.binanceIntegrationEnabled)
            && !(props.userData.settings.binanceIntegrationEnabled && !props.binanceSettingsEnabled)
            && !!props.userData.settings.binanceIntegrationApiKey
            && !!props.userData.settings.binanceIntegrationApiSecret
            && props.userData.settings.binanceIntegrationApiKey !== props.binanceApiKeyInput
            && props.userData.settings.binanceIntegrationApiSecret !== props.binanceApiSecretInput);
    if (isPreValid) {
        if (props.binanceApiKeyInput && props.binanceApiSecretInput) {
            props.setBinanceUserDataLoading(true)
        }
    }
    validateBinanceSettings(isPreValid, props.binanceApiKeyInput, props.binanceApiSecretInput,
        props.binanceCurrencies, props.binanceUserData, props.setBinanceUserData,)
        .then(isValid => {
            if (isValid) {
                const userDataNew = {...props.userData};
                let shouldSave = false;
                if (!userDataNew.settings) {
                    userDataNew.settings = new UserSettings();
                }
                if (props.binanceSettingsEnabled !== null
                    && userDataNew.settings.binanceIntegrationEnabled !== props.binanceSettingsEnabled
                ) {
                    userDataNew.settings.binanceIntegrationEnabled = props.binanceSettingsEnabled;
                    shouldSave = true;
                }
                if (props.binanceApiKeyInput !== null
                    && userDataNew.settings.binanceIntegrationApiKey !== props.binanceApiKeyInput
                ) {
                    userDataNew.settings.binanceIntegrationApiKey = props.binanceApiKeyInput;
                    shouldSave = true;
                }
                if (props.binanceApiSecretInput !== null
                    && userDataNew.settings.binanceIntegrationApiSecret !== props.binanceApiSecretInput
                ) {
                    userDataNew.settings.binanceIntegrationApiSecret = props.binanceApiSecretInput;
                    shouldSave = true;
                }
                if (shouldSave) {
                    props.setUserData(userDataNew);
                }
                props.stateReset();
                props.setCreatingNewAsset(false)
                props.setShowCreateNewAssetWindow(false)
            } else {
                props.setBinanceApiKeysInputInvalid(true)
                props.setBinanceUserDataLoading(false)
            }
        })
        .catch(reason => {
            console.info(reason)
        })
}
