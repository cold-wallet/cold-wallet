import Props from "../../Props";
import {Dispatch, SetStateAction} from "react";
import IntegrationSetting from "../IntegrationSetting";

export default function CoinGeckoSettings(exchangeName: string, props: Props) {
    const integrations = props.userData.settings.integrations;
    const settingEnabled = props.enabledCcxtIntegrations.has(exchangeName)
        || (!!integrations && integrations[exchangeName] && integrations[exchangeName].enabled);
    const setSettingEnabled: Dispatch<SetStateAction<boolean>> = (isEnabled) => {
        const settings = new Set(props.enabledCcxtIntegrations)
        isEnabled ? settings.add(exchangeName) : settings.delete(exchangeName)
        props.setEnabledCcxtIntegrations(settings)
    }
    const isDataLoading = props.loadingUserDataFromResource === exchangeName
    const apiKeyFromSettings = integrations && integrations[exchangeName]
        && integrations[exchangeName].apiKey || null;
    const apiSecretFromSettings = integrations && integrations[exchangeName]
        && integrations[exchangeName].apiSecret || null;
    const apiPasswordFromSettings = integrations && integrations[exchangeName]
        && integrations[exchangeName].password || null;
    const additionalApiParameterFromSettings = integrations && integrations[exchangeName]
        && integrations[exchangeName].additionalSetting || null;
    props.currentIntegrationApiKey === null && apiKeyFromSettings !== null
    && props.setCurrentIntegrationApiKey(apiKeyFromSettings)
    props.currentIntegrationApiSecret === null && apiSecretFromSettings !== null
    && props.setCurrentIntegrationApiSecret(apiSecretFromSettings)
    props.currentIntegrationApiPassword === null && apiPasswordFromSettings !== null
    && props.setCurrentIntegrationApiPassword(apiPasswordFromSettings)
    props.currentIntegrationApiAdditionalSetting === null && additionalApiParameterFromSettings !== null
    && props.setCurrentIntegrationApiAdditionalSetting(additionalApiParameterFromSettings)
    return IntegrationSetting(
        props,
        settingEnabled,
        exchangeName,
        setSettingEnabled,
        isDataLoading,
        [{
            settingName: "API key",
            isInvalid: props.currentSettingInputsInvalid,
            setIsInvalid: props.setCurrentSettingInputsInvalid,
            setValue: props.setCurrentIntegrationApiKey,
            defaultValue: (integrations && integrations[exchangeName] && integrations[exchangeName].apiKey) || "",
        }, {
            settingName: "API secret",
            isInvalid: props.currentSettingInputsInvalid,
            setIsInvalid: props.setCurrentSettingInputsInvalid,
            setValue: props.setCurrentIntegrationApiSecret,
            defaultValue: (integrations && integrations[exchangeName] && integrations[exchangeName].apiSecret) || "",
        }],
    )
}