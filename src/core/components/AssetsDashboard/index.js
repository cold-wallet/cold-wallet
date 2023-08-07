import './index.css';

import React from "react";
import AssetsManageButtons from "./../assets/AssetsManageButtons";
import Asset from "./../assets/Asset";
import EditNewAsset from "./../assets/EditNewAsset";
import NewAssetWindow from "./../assets/NewAssetWindow";
import AssetDeleteWindow from "./../assets/AssetDeleteWindow";
import EditAsset from "./../assets/EditAsset";
import SettingsWindow from "../settings/SettingsWindow";

export default function AssetsDashboard(
    {
            showCreateNewAssetWindow, setShowCreateNewAssetWindow,
            creatingNewAsset, setCreatingNewAsset,
            userData, setUserData,
            newAssetAmount, setNewAssetAmount,
            newAssetCurrency, setNewAssetCurrency,
            newAssetName, setNewAssetName,
            isNewAssetAmountInvalid, setIsNewAssetAmountInvalid,
            isNewAssetNameInvalid, setIsNewAssetNameInvalid,
            monobankCurrencies,
            binanceCurrencies,
            assetToDelete, setAssetToDelete,
            assetToEdit, setAssetToEdit,
            stateReset,
            showConfigsWindow, setShowConfigsWindow,
            monobankSettingsEnabled, setMonobankSettingsEnabled,
            monobankApiTokenInput, setMonobankApiTokenInput,
            monobankApiTokenInputInvalid, setMonobankApiTokenInputInvalid,
            monobankUserData, setMonobankUserData,
            monobankUserDataLoading, setMonobankUserDataLoading,
            integrationWindowNameSelected, setIntegrationWindowNameSelected,
            binanceSettingsEnabled, setBinanceSettingsEnabled,
            binanceApiKeyInput, setBinanceApiKeyInput,
            binanceApiSecretInput, setBinanceApiSecretInput,
            binanceApiKeysInputInvalid, setBinanceApiKeysInputInvalid,
            binanceUserData, setBinanceUserData,
            binanceUserDataLoading, setBinanceUserDataLoading,
    }
) {
    return (
        <div className={"application-box flex-box flex-direction-row"}>
            {showCreateNewAssetWindow && NewAssetWindow(
                setNewAssetCurrency,
                setShowCreateNewAssetWindow,
                setCreatingNewAsset,
                monobankCurrencies,
                binanceCurrencies,
                userData,
            )}
            {assetToDelete && AssetDeleteWindow(
                assetToDelete, setAssetToDelete, userData, setUserData, setShowCreateNewAssetWindow,
                setCreatingNewAsset, stateReset,
            )}
            {showConfigsWindow && SettingsWindow({
                stateReset,
                    userData, setUserData,
                    monobankSettingsEnabled, setMonobankSettingsEnabled,
                    monobankApiTokenInput, setMonobankApiTokenInput,
                    monobankApiTokenInputInvalid, setMonobankApiTokenInputInvalid,
                    monobankUserData, setMonobankUserData,
                    monobankUserDataLoading, setMonobankUserDataLoading,
                    integrationWindowNameSelected, setIntegrationWindowNameSelected,
                    binanceCurrencies,
                    binanceSettingsEnabled, setBinanceSettingsEnabled,
                    binanceApiKeyInput, setBinanceApiKeyInput,
                    binanceApiSecretInput, setBinanceApiSecretInput,
                    binanceApiKeysInputInvalid, setBinanceApiKeysInputInvalid,
                    binanceUserData, setBinanceUserData,
                    binanceUserDataLoading, setBinanceUserDataLoading,
            })}
            <div className={"assets-panel flex-box-centered flex-direction-column layer-1-themed-color"}>
                {AssetsManageButtons({
                    setShowCreateNewAssetWindow,
                    setCreatingNewAsset,
                    setShowConfigsWindow,
                    stateReset,
                    userData,
                })}
                {!showCreateNewAssetWindow && creatingNewAsset && EditNewAsset(
                    newAssetCurrency,
                    isNewAssetAmountInvalid, setIsNewAssetAmountInvalid,
                    newAssetAmount, setNewAssetAmount,
                    newAssetName, setNewAssetName,
                    setShowCreateNewAssetWindow,
                    isNewAssetNameInvalid, setIsNewAssetNameInvalid,
                    userData, setUserData,
                    setCreatingNewAsset,
                    stateReset,
                )}
                {(userData.assets || []).map(asset => (assetToEdit && (asset.id === assetToEdit.id))
                    ? EditAsset(
                        assetToEdit,
                        userData, setUserData,
                        isNewAssetAmountInvalid, setIsNewAssetAmountInvalid,
                        newAssetAmount, setNewAssetAmount,
                        newAssetName, setNewAssetName,
                        isNewAssetNameInvalid, setIsNewAssetNameInvalid,
                        stateReset,
                    )
                    : Asset(
                        asset,
                        setAssetToDelete,
                        setAssetToEdit,
                        setNewAssetAmount,
                        setNewAssetName,
                        stateReset,
                    ))}
            </div>
        </div>
    );
}
