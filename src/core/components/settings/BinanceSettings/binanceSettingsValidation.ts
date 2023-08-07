import binanceApiClient, {AccountInfo} from "../../../integrations/binance/binanceApiClient";
import UserData, {UserSettings} from "../../../domain/UserData";
import {Dispatch, SetStateAction} from "react";
import BinanceCurrencyResponse from "../../../integrations/binance/BinanceCurrencyResponse";

async function validateBinanceSettings(
    userData: UserData,
    binanceSettingsEnabled: boolean,
    binanceApiKeyInput: string,
    binanceApiSecretInput: string,
    binanceCurrencies: { [index: string]: BinanceCurrencyResponse },
    binanceUserData: AccountInfo | null,
    setBinanceUserData: Dispatch<SetStateAction<AccountInfo | null>>,
) {
    let isValidSettings = true;

    if (!userData.settings.binanceIntegrationEnabled && binanceSettingsEnabled
        || (binanceSettingsEnabled || userData.settings.binanceIntegrationEnabled)
        && !(userData.settings.binanceIntegrationEnabled && !binanceSettingsEnabled)
        && userData.settings.binanceIntegrationApiKey
        && userData.settings.binanceIntegrationApiSecret
        && userData.settings.binanceIntegrationApiKey !== binanceApiKeyInput
        && userData.settings.binanceIntegrationApiSecret !== binanceApiSecretInput
    ) {
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

export default function binanceSettingsValidation(
    userData: UserData,
    setUserData: Dispatch<SetStateAction<UserData | null>>,
    binanceSettingsEnabled: boolean,
    binanceApiKeyInput: string,
    binanceApiSecretInput: string,
    setBinanceUserDataLoading: Dispatch<SetStateAction<boolean | null>>,
    stateReset: Dispatch<SetStateAction<void>>,
    setBinanceApiKeysInputInvalid: Dispatch<SetStateAction<boolean | null>>,
    binanceCurrencies: { [index: string]: BinanceCurrencyResponse },
    binanceUserData: AccountInfo | null,
    setBinanceUserData: Dispatch<SetStateAction<AccountInfo | null>>,
) {
    if (!userData.settings.binanceIntegrationEnabled && binanceSettingsEnabled
        || (binanceSettingsEnabled || userData.settings.binanceIntegrationEnabled)
        && !(userData.settings.binanceIntegrationEnabled && !binanceSettingsEnabled)
        && userData.settings.binanceIntegrationApiKey
        && userData.settings.binanceIntegrationApiSecret
        && userData.settings.binanceIntegrationApiKey !== binanceApiKeyInput
        && userData.settings.binanceIntegrationApiSecret !== binanceApiSecretInput
    ) {
        if (binanceApiKeyInput && binanceApiSecretInput) {
            setBinanceUserDataLoading(true)
        }
    }
    validateBinanceSettings(
        userData,
        binanceSettingsEnabled,
        binanceApiKeyInput,
        binanceApiSecretInput,
        binanceCurrencies,
        binanceUserData,
        setBinanceUserData,
    )
        .then(isValid => {
            if (isValid) {
                const userDataNew = {...userData};
                let shouldSave = false;
                if (!userDataNew.settings) {
                    userDataNew.settings = new UserSettings();
                }
                if (binanceSettingsEnabled !== null
                    && userDataNew.settings.binanceIntegrationEnabled !== binanceSettingsEnabled
                ) {
                    userDataNew.settings.binanceIntegrationEnabled = binanceSettingsEnabled;
                    shouldSave = true;
                }
                if (binanceApiKeyInput !== null
                    && userDataNew.settings.binanceIntegrationApiKey !== binanceApiKeyInput
                ) {
                    userDataNew.settings.binanceIntegrationApiKey = binanceApiKeyInput;
                    shouldSave = true;
                }
                if (binanceApiSecretInput !== null
                    && userDataNew.settings.binanceIntegrationApiSecret !== binanceApiSecretInput
                ) {
                    userDataNew.settings.binanceIntegrationApiSecret = binanceApiSecretInput;
                    shouldSave = true;
                }
                if (shouldSave) {
                    setUserData(userDataNew);
                }
                stateReset();
            } else {
                setBinanceApiKeysInputInvalid(true)
                setBinanceUserDataLoading(false)
            }
        })
        .catch(reason => {
            console.info(reason)
        })
}
