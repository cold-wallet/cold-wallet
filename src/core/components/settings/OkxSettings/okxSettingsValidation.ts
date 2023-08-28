import UserData, {UserSettings} from "../../../domain/UserData";
import {Dispatch, SetStateAction} from "react";
import OkxCurrencyResponse from "../../../integrations/okx/OkxCurrencyResponse";
import okxApiClient, {OkxAccount} from "../../../integrations/okx/okxApiClient";

async function validateOkxSettings(
    userData: UserData,
    okxSettingsEnabled: boolean,
    okxApiKeyInput: string,
    okxApiSecretInput: string,
    okxApiPassPhraseInput: string,
    okxApiSubAccountNameInput: string,
    okxCurrencies: { [index: string]: OkxCurrencyResponse },
    okxUserData: OkxAccount | null,
    setOkxUserData: Dispatch<SetStateAction<OkxAccount | null>>,
) {
    let isValidSettings = true;

    if (!userData.settings.okxIntegrationEnabled && okxSettingsEnabled
        || (okxSettingsEnabled || userData.settings.okxIntegrationEnabled)
        && !(userData.settings.okxIntegrationEnabled && !okxSettingsEnabled)
        && userData.settings.okxIntegrationApiKey
        && userData.settings.okxIntegrationApiSecret
        && userData.settings.okxIntegrationPassPhrase
        && (userData.settings.okxIntegrationApiKey !== okxApiKeyInput
            && userData.settings.okxIntegrationApiSecret !== okxApiSecretInput
            || userData.settings.okxIntegrationPassPhrase !== okxApiPassPhraseInput
            || userData.settings.okxIntegrationSubAccountName !== okxApiSubAccountNameInput)
    ) {
        if (!okxApiKeyInput || !okxApiSecretInput) {
            isValidSettings = false;
        } else {
            let accountInfo = await okxApiClient.getUserInfo(
                okxApiKeyInput, okxApiSecretInput, okxApiPassPhraseInput, okxApiSubAccountNameInput,
                okxCurrencies, okxUserData
            );
            if (accountInfo.subAccountBalances || accountInfo.spotAccountBalances) {
                setOkxUserData(accountInfo)
            } else {
                isValidSettings = false;
            }
        }
    }
    return isValidSettings;
}

export default function okxSettingsValidation(
    userData: UserData, setUserData: Dispatch<SetStateAction<UserData | null>>,
    okxSettingsEnabled: boolean,
    okxApiKeyInput: string,
    okxApiSecretInput: string,
    okxApiPassPhraseInput: string,
    okxApiSubAccountNameInput: string,
    setOkxApiKeysInputInvalid: Dispatch<SetStateAction<boolean | null>>,
    setOkxUserDataLoading: Dispatch<SetStateAction<boolean | null>>,
    okxCurrencies: { [index: string]: OkxCurrencyResponse },
    okxUserData: OkxAccount | null, setOkxUserData: Dispatch<SetStateAction<OkxAccount | null>>,
    stateReset: Dispatch<SetStateAction<void>>,
    setCreatingNewAsset: Dispatch<SetStateAction<boolean>>,
    setShowCreateNewAssetWindow: Dispatch<SetStateAction<boolean>>,
) {
    if (!userData.settings.okxIntegrationEnabled && okxSettingsEnabled
        || (okxSettingsEnabled || userData.settings.okxIntegrationEnabled)
        && !(userData.settings.okxIntegrationEnabled && !okxSettingsEnabled)
        && userData.settings.okxIntegrationApiKey
        && userData.settings.okxIntegrationApiSecret
        && userData.settings.okxIntegrationPassPhrase
        && (userData.settings.okxIntegrationApiKey !== okxApiKeyInput
            && userData.settings.okxIntegrationApiSecret !== okxApiSecretInput
            || userData.settings.okxIntegrationPassPhrase !== okxApiPassPhraseInput
            || userData.settings.okxIntegrationSubAccountName !== okxApiSubAccountNameInput)
    ) {
        if (okxApiKeyInput && okxApiSecretInput && okxApiPassPhraseInput) {
            setOkxUserDataLoading(true)
        }
    }
    validateOkxSettings(
        userData,
        okxSettingsEnabled,
        okxApiKeyInput,
        okxApiSecretInput,
        okxApiPassPhraseInput,
        okxApiSubAccountNameInput,
        okxCurrencies,
        okxUserData,
        setOkxUserData,
    )
        .then(isValid => {
            if (isValid) {
                const userDataNew = {...userData};
                let shouldSave = false;
                if (!userDataNew.settings) {
                    userDataNew.settings = new UserSettings();
                }
                if (okxSettingsEnabled !== null
                    && userDataNew.settings.okxIntegrationEnabled !== okxSettingsEnabled
                ) {
                    userDataNew.settings.okxIntegrationEnabled = okxSettingsEnabled;
                    shouldSave = true;
                }
                if (okxApiKeyInput !== null
                    && userDataNew.settings.okxIntegrationApiKey !== okxApiKeyInput
                ) {
                    userDataNew.settings.okxIntegrationApiKey = okxApiKeyInput;
                    shouldSave = true;
                }
                if (okxApiSecretInput !== null
                    && userDataNew.settings.okxIntegrationApiSecret !== okxApiSecretInput
                ) {
                    userDataNew.settings.okxIntegrationApiSecret = okxApiSecretInput;
                    shouldSave = true;
                }
                if (okxApiPassPhraseInput !== null
                    && userDataNew.settings.okxIntegrationPassPhrase !== okxApiPassPhraseInput
                ) {
                    userDataNew.settings.okxIntegrationPassPhrase = okxApiPassPhraseInput;
                    shouldSave = true;
                }
                if (okxApiSubAccountNameInput !== null
                    && userDataNew.settings.okxIntegrationSubAccountName !== okxApiSubAccountNameInput
                ) {
                    userDataNew.settings.okxIntegrationSubAccountName = okxApiSubAccountNameInput;
                    shouldSave = true;
                }
                if (shouldSave) {
                    setUserData(userDataNew);
                }
                stateReset();
                setCreatingNewAsset(false);
                setShowCreateNewAssetWindow(false)
            } else {
                setOkxApiKeysInputInvalid(true)
                setOkxUserDataLoading(false)
            }
        })
        .catch(reason => {
            console.info(reason)
        })
}
