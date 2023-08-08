import './index.css';

import React from "react";
import AssetsManageButtons from "./../assets/AssetsManageButtons";
import Asset from "./../assets/Asset";
import EditNewAsset from "./../assets/EditNewAsset";
import NewAssetWindow from "../NewAssetWindow";
import AssetDeleteWindow from "./../assets/AssetDeleteWindow";
import EditAsset from "./../assets/EditAsset";
import SettingsWindow from "../settings/SettingsWindow";
import BinanceIntegrationAssets from "../assets/BinanceIntegrationAssets";
import MonobankIntegrationAssets from "../assets/MonobankIntegrationAssets";

export default function AssetsDashboard(
    {
            anyAssetExist,
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
                stateReset,
                anyAssetExist,
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
            )}
            {assetToDelete && AssetDeleteWindow(
                assetToDelete, userData, setUserData, setShowCreateNewAssetWindow,
                setCreatingNewAsset, stateReset, binanceUserData, monobankUserData,
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
                    {anyAssetExist ? AssetsManageButtons({
                    setShowCreateNewAssetWindow,
                    setCreatingNewAsset,
                    setShowConfigsWindow,
                    stateReset,
                    }) : null}
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
                    anyAssetExist,
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
                    {userData.settings.binanceIntegrationEnabled ? BinanceIntegrationAssets(binanceUserData) : null}
                    {userData.settings.monobankIntegrationEnabled ? MonobankIntegrationAssets(monobankUserData) : null}
            </div>
        </div>
    );
}
