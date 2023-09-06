import monobankApiClient from "../../../integrations/monobank/monobankApiClient";
import {UserSettings} from "../../../domain/UserData";
import {Dispatch, SetStateAction} from "react";
import MonobankUserData from "../../../integrations/monobank/MonobankUserData";
import Props from "../../Props";

async function validateMonobankSettings(
    preValid: boolean,
    monobankApiTokenInput: string | null,
    setMonobankUserData: Dispatch<SetStateAction<MonobankUserData | null>>,
) {
    let isValidSettings = true;

    if (preValid) {
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

export default function monobankSettingsValidation(props: Props) {
    const preValid = (!props.userData.settings.monobankIntegrationEnabled && props.monobankSettingsEnabled)
        || ((props.monobankSettingsEnabled || props.userData.settings.monobankIntegrationEnabled)
            && !(props.userData.settings.monobankIntegrationEnabled && !props.monobankSettingsEnabled)
            && !!props.userData.settings.monobankIntegrationToken
            && props.userData.settings.monobankIntegrationToken !== props.monobankApiTokenInput);
    if (preValid) {
        if (props.monobankApiTokenInput) {
            props.setMonobankUserDataLoading(true)
        }
    }

    validateMonobankSettings(preValid, props.monobankApiTokenInput, props.setMonobankUserData,)
        .then(isValid => {
            if (isValid) {
                const userDataNew = {...props.userData};
                let shouldSave = false;
                if (!userDataNew.settings) {
                    userDataNew.settings = new UserSettings();
                }
                if (props.monobankSettingsEnabled !== null
                    && userDataNew.settings.monobankIntegrationEnabled !== props.monobankSettingsEnabled
                ) {
                    userDataNew.settings.monobankIntegrationEnabled = props.monobankSettingsEnabled;
                    shouldSave = true;
                }
                if (props.monobankApiTokenInput !== null
                    && userDataNew.settings.monobankIntegrationToken !== props.monobankApiTokenInput
                ) {
                    userDataNew.settings.monobankIntegrationToken = props.monobankApiTokenInput;
                    shouldSave = true;
                }
                if (shouldSave) {
                    props.setUserData(userDataNew);
                }
                props.stateReset();
                props.setCreatingNewAsset(false)
                props.setShowCreateNewAssetWindow(false)
            } else {
                props.setMonobankApiTokenInputInvalid(true)
                props.setMonobankUserDataLoading(false)
            }
        })
        .catch(reason => {
            console.info(reason)
        })
}
