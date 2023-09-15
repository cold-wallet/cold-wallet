import Props from "../../Props";
import {Integrations, IntegrationSettingsData, UserSettings} from "../../../domain/UserData";
import ApiResponse from "../../../domain/ApiResponse";
import ccxtConnector from "../../../integrations/ccxt/ccxtConnector";

export function genericExchangeSettingsValidation(exchangeName: string, props: Props) {
    const settings = (props.userData.settings.integrations
            && props.userData.settings.integrations[exchangeName])
        || {} as IntegrationSettingsData;
    const isEnabledInProps = props.enabledCcxtIntegrations.has(exchangeName);

    if (settings.enabled == isEnabledInProps
        && settings.apiKey == props.currentIntegrationApiKey
        && settings.apiSecret == props.currentIntegrationApiSecret
        && settings.password == props.currentIntegrationApiPassword
        && settings.additionalSetting == props.currentIntegrationApiAdditionalSetting
    ) {
        props.stateReset()
        return
    }
    if (settings.enabled && !isEnabledInProps) {
        saveUserSettings(exchangeName, props, isEnabledInProps, settings)
        return
    }
    validateGenericSettings(exchangeName, props, isEnabledInProps, settings)
        .then(isValid => {
            if (isValid) {
                saveUserSettings(exchangeName, props, isEnabledInProps, settings)
            } else {
                props.setCurrentSettingInputsInvalid(true)
                props.setLoadingUserDataFromResource(null)
            }
        })
        .catch(reason => {
            console.info(reason)
        })
}

async function validateGenericSettings(
    exchangeName: string, props: Props, isEnabledInProps: boolean, settings: IntegrationSettingsData,
) {
    const isPreValid = isEnabledInProps && !!settings.apiKey && !!settings.apiSecret
    if (isPreValid && props.loadingUserDataFromResource !== exchangeName) {
        props.setLoadingUserDataFromResource(exchangeName)
    }
    if (isPreValid) {
        if (!props.currentIntegrationApiKey
            || !props.currentIntegrationApiSecret
            || !props.enabledCcxtIntegrations.has(exchangeName)
        ) {
            return false;
        } else {
            const response: ApiResponse<any> = await ccxtConnector.loadUserData(exchangeName,
                props.currentIntegrationApiKey, props.currentIntegrationApiSecret, props.currentIntegrationApiPassword,
                props.currentIntegrationApiAdditionalSetting
            );
            if (response.success) {
                const accountInfo = response.result;
                const newUserData = {...props.ccxtUserData}
                newUserData[exchangeName] = accountInfo
                props.setCcxtUserData(newUserData)
            } else {
                return false;
            }
        }
    }
    return true;
}

function saveUserSettings(
    exchangeName: string, props: Props, isEnabledInProps: boolean, settings: IntegrationSettingsData,
) {
    const userDataNew = {...props.userData};
    if (!userDataNew.settings) {
        userDataNew.settings = new UserSettings();
    }
    if (!userDataNew.settings.integrations) {
        userDataNew.settings.integrations = {} as Integrations;
    }
    if (!userDataNew.settings.integrations[exchangeName]) {
        userDataNew.settings.integrations[exchangeName] = {} as IntegrationSettingsData;
    }
    const newSettings = userDataNew.settings.integrations[exchangeName];
    let shouldSave = false;
    if (settings.enabled !== isEnabledInProps) {
        newSettings.enabled = isEnabledInProps;
        shouldSave = true;
    }
    if (props.currentIntegrationApiKey !== null
        && settings.apiKey !== props.currentIntegrationApiKey
    ) {
        newSettings.apiKey = props.currentIntegrationApiKey;
        shouldSave = true;
    }
    if (props.currentIntegrationApiSecret !== null
        && settings.apiSecret !== props.currentIntegrationApiSecret
    ) {
        newSettings.apiSecret = props.currentIntegrationApiSecret;
        shouldSave = true;
    }
    if (props.currentIntegrationApiPassword !== null
        && settings.password !== props.currentIntegrationApiPassword
    ) {
        newSettings.password = props.currentIntegrationApiPassword;
        shouldSave = true;
    }
    if (props.currentIntegrationApiAdditionalSetting == null
        && settings.additionalSetting !== props.currentIntegrationApiAdditionalSetting
    ) {
        newSettings.additionalSetting = props.currentIntegrationApiAdditionalSetting;
        shouldSave = true;
    }
    if (shouldSave) {
        props.setUserData(userDataNew);
    }
    props.stateReset();
    props.setCreatingNewAsset(false);
    props.setShowCreateNewAssetWindow(false)
}
