import monobankApiClient from "../../../integrations/monobank/monobankApiClient";
import UserData, {UserSettings} from "../../../domain/UserData";
import {Dispatch, SetStateAction} from "react";
import MonobankUserData from "../../../integrations/monobank/MonobankUserData";

async function validateMonobankSettings(
    userData: UserData,
    monobankSettingsEnabled: boolean,
    monobankApiTokenInput: string,
    setMonobankUserData: Dispatch<SetStateAction<MonobankUserData | null>>,
) {
    let isValidSettings = true;

    if (!userData.settings.monobankIntegrationEnabled && monobankSettingsEnabled
        || (monobankSettingsEnabled || userData.settings.monobankIntegrationEnabled)
        && !(userData.settings.monobankIntegrationEnabled && !monobankSettingsEnabled)
        && userData.settings.monobankIntegrationToken
        && userData.settings.monobankIntegrationToken !== monobankApiTokenInput
    ) {
        if (!monobankApiTokenInput) {
            isValidSettings = false;
        } else {
            let response = await monobankApiClient.getUserInfo(monobankApiTokenInput);
            if (response.success) {
                setMonobankUserData(response.result)
            } else {
                isValidSettings = false;
            }
        }
    }
    return isValidSettings;
}

export default function monobankSettingsValidation(
    userData: UserData,
    setUserData: Dispatch<SetStateAction<UserData | null>>,
    stateReset: Dispatch<SetStateAction<void>>,
    setMonobankApiTokenInputInvalid: Dispatch<SetStateAction<boolean | null>>,
    monobankSettingsEnabled: boolean,
    monobankApiTokenInput: string,
    setMonobankUserData: Dispatch<SetStateAction<MonobankUserData | null>>,
    setMonobankUserDataLoading: Dispatch<SetStateAction<boolean | null>>,
    setCreatingNewAsset: Dispatch<SetStateAction<boolean>>,
    setShowCreateNewAssetWindow: Dispatch<SetStateAction<boolean>>,
) {
    if (!userData.settings.monobankIntegrationEnabled && monobankSettingsEnabled
        || (monobankSettingsEnabled || userData.settings.monobankIntegrationEnabled)
        && !(userData.settings.monobankIntegrationEnabled && !monobankSettingsEnabled)
        && userData.settings.monobankIntegrationToken
        && userData.settings.monobankIntegrationToken !== monobankApiTokenInput
    ) {
        if (monobankApiTokenInput) {
            setMonobankUserDataLoading(true)
        }
    }

    validateMonobankSettings(userData, monobankSettingsEnabled, monobankApiTokenInput, setMonobankUserData,)
        .then(isValid => {
            if (isValid) {
                const userDataNew = {...userData};
                let shouldSave = false;
                if (!userDataNew.settings) {
                    userDataNew.settings = new UserSettings();
                }
                if (monobankSettingsEnabled !== null
                    && userDataNew.settings.monobankIntegrationEnabled !== monobankSettingsEnabled
                ) {
                    userDataNew.settings.monobankIntegrationEnabled = monobankSettingsEnabled;
                    shouldSave = true;
                }
                if (monobankApiTokenInput !== null
                    && userDataNew.settings.monobankIntegrationToken !== monobankApiTokenInput
                ) {
                    userDataNew.settings.monobankIntegrationToken = monobankApiTokenInput;
                    shouldSave = true;
                }
                if (shouldSave) {
                    setUserData(userDataNew);
                }
                stateReset();
                setCreatingNewAsset(false)
                setShowCreateNewAssetWindow(false)
            } else {
                setMonobankApiTokenInputInvalid(true)
                setMonobankUserDataLoading(false)
            }
        })
        .catch(reason => {
            console.info(reason)
        })
}
