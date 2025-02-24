import {MetaMaskIntegrationSettingsData, UserSettings} from "../../../domain/UserData";
import Props from "../../Props";
import {MetaMaskAccount} from "../../../integrations/metamask/MetaMaskWallet";

export function metaMaskSettingsValidation(props: Props) {
    const settings = props.userData.settings.metaMask
        || {} as MetaMaskIntegrationSettingsData;

    const hasAddresses = Object.keys(props.metaMaskWallet?.accounts || {}).length > 0;

    if (!settings.enabled && (settings.enabled == props.metaMaskSettingsEnabled) && !hasAddresses) {
        props.stateReset()
        return
    }
    saveUserSettings(props, props.metaMaskSettingsEnabled, settings)
}


function saveUserSettings(
    props: Props, isEnabledInProps: boolean, settings: MetaMaskIntegrationSettingsData,
) {
    const userDataNew = {...props.userData};
    if (!userDataNew.settings) {
        userDataNew.settings = new UserSettings();
    }
    if (!userDataNew.settings.metaMask) {
        userDataNew.settings.metaMask = {} as MetaMaskIntegrationSettingsData;
    }
    if (!userDataNew.settings.metaMask.accounts) {
        userDataNew.settings.metaMask.accounts = {} as MetaMaskAccount;
    }
    const newSettings = userDataNew.settings.metaMask;
    let shouldSave = false;
    if (settings.enabled !== isEnabledInProps) {
        newSettings.enabled = isEnabledInProps;
        shouldSave = true;
    }
    if (props.metaMaskWallet?.accounts
        && (Object.keys(newSettings.accounts || {}).length != (props.metaMaskWallet?.accounts?.length || 0))
    ) {
        props.metaMaskWallet.accounts.forEach(account => {
            if (!newSettings.accounts[account]) {
                newSettings.accounts[account] = {}
                shouldSave = true
            }
        })
    }
    if (shouldSave) {
        props.setUserData(userDataNew);
    }
    props.stateReset();
    props.setCreatingNewAsset(false);
    props.setShowCreateNewAssetWindow(false)
}
