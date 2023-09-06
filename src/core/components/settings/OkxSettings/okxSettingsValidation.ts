import {UserSettings} from "../../../domain/UserData";
import okxApiClient from "../../../integrations/okx/okxApiClient";
import Props from "../../Props";

async function validateOkxSettings(isPreValid: boolean, props: Props) {
    let isValidSettings = true;

    if (isPreValid) {
        if (!props.okxApiKeyInput || !props.okxApiSecretInput || !props.okxApiPassPhraseInput) {
            isValidSettings = false;
        } else {
            let accountInfo = await okxApiClient.getUserInfo(
                props.okxApiKeyInput, props.okxApiSecretInput, props.okxApiPassPhraseInput,
                props.okxApiSubAccountNameInput, props.okxCurrencies, props.okxUserData
            );
            if (accountInfo.subAccountBalances || accountInfo.spotAccountBalances) {
                props.setOkxUserData(accountInfo)
            } else {
                isValidSettings = false;
            }
        }
    }
    return isValidSettings;
}

export default function okxSettingsValidation(props: Props) {
    const settings = props.userData.settings;
    const isPreValid = (!settings.okxIntegrationEnabled && props.okxSettingsEnabled)
        || ((props.okxSettingsEnabled || settings.okxIntegrationEnabled)
            && !(settings.okxIntegrationEnabled && !props.okxSettingsEnabled)
            && !!settings.okxIntegrationApiKey
            && !!settings.okxIntegrationApiSecret
            && !!settings.okxIntegrationPassPhrase
            && ((settings.okxIntegrationApiKey !== props.okxApiKeyInput
                    && settings.okxIntegrationApiSecret !== props.okxApiSecretInput)
                || settings.okxIntegrationPassPhrase !== props.okxApiPassPhraseInput
                || settings.okxIntegrationSubAccountName !== props.okxApiSubAccountNameInput));

    if (isPreValid) {
        if (props.okxApiKeyInput && props.okxApiSecretInput && props.okxApiPassPhraseInput) {
            props.setOkxUserDataLoading(true)
        }
    }
    validateOkxSettings(isPreValid, props)
        .then(isValid => {
            if (isValid) {
                const userDataNew = {...props.userData};
                let shouldSave = false;
                if (!userDataNew.settings) {
                    userDataNew.settings = new UserSettings();
                }
                if (props.okxSettingsEnabled !== null
                    && userDataNew.settings.okxIntegrationEnabled !== props.okxSettingsEnabled
                ) {
                    userDataNew.settings.okxIntegrationEnabled = props.okxSettingsEnabled;
                    shouldSave = true;
                }
                if (props.okxApiKeyInput !== null
                    && userDataNew.settings.okxIntegrationApiKey !== props.okxApiKeyInput
                ) {
                    userDataNew.settings.okxIntegrationApiKey = props.okxApiKeyInput;
                    shouldSave = true;
                }
                if (props.okxApiSecretInput !== null
                    && userDataNew.settings.okxIntegrationApiSecret !== props.okxApiSecretInput
                ) {
                    userDataNew.settings.okxIntegrationApiSecret = props.okxApiSecretInput;
                    shouldSave = true;
                }
                if (props.okxApiPassPhraseInput !== null
                    && userDataNew.settings.okxIntegrationPassPhrase !== props.okxApiPassPhraseInput
                ) {
                    userDataNew.settings.okxIntegrationPassPhrase = props.okxApiPassPhraseInput;
                    shouldSave = true;
                }
                if (props.okxApiSubAccountNameInput !== null
                    && userDataNew.settings.okxIntegrationSubAccountName !== props.okxApiSubAccountNameInput
                ) {
                    userDataNew.settings.okxIntegrationSubAccountName = props.okxApiSubAccountNameInput;
                    shouldSave = true;
                }
                if (shouldSave) {
                    props.setUserData(userDataNew);
                }
                props.stateReset();
                props.setCreatingNewAsset(false);
                props.setShowCreateNewAssetWindow(false)
            } else {
                props.setOkxApiKeysInputInvalid(true)
                props.setOkxUserDataLoading(false)
            }
        })
        .catch(reason => {
            console.info(reason)
        })
}
