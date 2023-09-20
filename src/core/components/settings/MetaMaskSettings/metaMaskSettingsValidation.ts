import {MetaMaskIntegrationSettingsData} from "../../../domain/UserData";
import Props from "../../Props";

async function validateMetaMaskSettings(
    props: Props,
) {
    let isValidSettings = true;

    // if (isPreValid) {
    // if (!props.okxApiKeyInput || !props.okxApiSecretInput || !props.okxApiPassPhraseInput) {
    //     isValidSettings = false;
    // } else {
    // let accountInfo = await metaMaskConnector.getUserInfo(
    //     props.okxApiKeyInput, props.okxApiSecretInput, props.okxApiPassPhraseInput,
    //     props.okxApiSubAccountNameInput, props.okxCurrencies, props.okxUserData
    // );
    // if (accountInfo.subAccountBalances || accountInfo.spotAccountBalances) {
    //     props.setOkxUserData(accountInfo)
    // } else {
    //     isValidSettings = false;
    // }
    // }
    // }
    return isValidSettings;
}

export function metaMaskSettingsValidation(props: Props) {
    const settings = props.userData.settings.metaMask
        || {} as MetaMaskIntegrationSettingsData;

    if (settings.enabled == props.metaMaskSettingsEnabled
        // && settings.apiKey == props.currentIntegrationApiKey
        // && settings.apiSecret == props.currentIntegrationApiSecret
        // && settings.password == props.currentIntegrationApiPassword
        // && settings.additionalSetting == props.currentIntegrationApiAdditionalSetting
    ) {
        props.stateReset()
        return
    }
    if (settings.enabled && !props.metaMaskSettingsEnabled) {
        // saveUserSettings(exchangeName, props, props.metaMaskSettingsEnabled, settings)
        return
    }
    validateMetaMaskSettings(props)
        .then(isValid => {
            if (isValid) {
                // saveUserSettings(exchangeName, props, props.metaMaskSettingsEnabled, settings)
            } else {
                props.setCurrentSettingInputsInvalid(true)
                props.setLoadingUserDataFromResource(null)
            }
        })
        .catch(reason => {
            console.info(reason)
        })
}