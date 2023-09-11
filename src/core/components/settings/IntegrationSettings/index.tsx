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
import okxSettingsValidation from "../OkxSettings/okxSettingsValidation";
import Props from "../../Props";
import IntegrationSetting from "../IntegrationSetting";
import {Integrations, IntegrationSettingsData, UserSettings} from "../../../domain/UserData";
import ccxtConnector from "../../../integrations/ccxt/ccxtConnector";
import ApiResponse from "../../../domain/ApiResponse";

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
                console.log("accountInfo", accountInfo)
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

export function onSaveSetting(props: Props, onDefault: () => void) {
    switch (props.integrationWindowNameSelected) {
        case monobankIntegration.name:
            return monobankSettingsValidation(props)
        case binanceIntegration.name:
            return binanceSettingsValidation(props)
        case okxIntegration.name:
            return okxSettingsValidation(props)
        case null:
        case "":
            return onDefault()
        default:
            return genericExchangeSettingsValidation(props.integrationWindowNameSelected, props)
    }
}

function buildSettingsForCcxtExchange(exchangeName: string, props: Props) {
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

export function buildSettingContent(props: Props, onDefault: () => JSX.Element) {
    switch (props.integrationWindowNameSelected) {
        case monobankIntegration.name:
            return MonobankSettings(props)
        case binanceIntegration.name:
            return BinanceSettings(props)
        case okxIntegration.name:
            return OkxSettings(props)
        case "":
        case null:
            return onDefault()
        default:
            return buildSettingsForCcxtExchange(props.integrationWindowNameSelected, props)
    }
}

export default function IntegrationSettings(
    defaultViewBuilder: () => JSX.Element,
    closeable: boolean,
    large: boolean,
    title: string,
    onClose: () => void,
    withBottom: boolean,
    props: Props,
) {

    return (
        <ModalWindow
            closeable={closeable}
            large={large}
            onCancel={onClose}
            title={title}
            children={
                <div className="settings-box">{buildSettingContent(props, defaultViewBuilder)}</div>
            }
            bottom={withBottom ? <>
                <PositiveButton onClick={() => onSaveSetting(props, () => props.stateReset())}
                                className="settings-window-bottom-button">Save
                </PositiveButton>
                <NeutralButton onClick={onClose}
                               className="settings-window-bottom-button">Cancel
                </NeutralButton>
            </> : null}
        />
    )
}
