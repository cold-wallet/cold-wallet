import './index.css';

import React from "react";
import AssetsManageButtons from "./../assets/AssetsManageButtons";
import EditNewAsset from "./../assets/EditNewAsset";
import NewAssetWindow from "../NewAssetWindow";
import AssetDeleteWindow from "./../assets/AssetDeleteWindow";
import EditAsset from "./../assets/EditAsset";
import SettingsWindow from "../settings/SettingsWindow";
import BinanceIntegrationAssets from "../assets/BinanceIntegrationAssets";
import MonobankIntegrationAssets from "../assets/MonobankIntegrationAssets";
import FirstPageStats from "../FirstPageStats";
import Asset from "../assets/Asset";
import AssetControls from "../assets/AssetControls";
import CurrencyRates from "../../currencyRates/CurrencyRates";

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
        monobankCurrencies, monobankRates,
        binanceCurrencies, binancePrices,
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
        selectedPageNumber, setSelectedPageNumber,
        firstPageChartType, setFirstPageChartType,
        firstPageChartView, setFirstPageChartView,
    }
) {

    const rates = new CurrencyRates(binancePrices, monobankRates)

    function buildNewAssetWindow() {
        return showCreateNewAssetWindow ? NewAssetWindow(
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
        ) : null
    }

    function buildAssetDeleteWindow() {
        return assetToDelete ? AssetDeleteWindow(
            assetToDelete, userData, setUserData, setShowCreateNewAssetWindow,
            setCreatingNewAsset, stateReset, binanceUserData, monobankUserData,
        ) : null
    }

    function buildSettingsWindow() {
        return showConfigsWindow ? SettingsWindow({
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
        }) : null
    }

    function buildAssetsManageButtons() {
        return anyAssetExist ? AssetsManageButtons({
            setShowCreateNewAssetWindow,
            setCreatingNewAsset,
            setShowConfigsWindow,
            stateReset,
        }) : null
    }

    function buildEditNewAsset() {
        return !showCreateNewAssetWindow && creatingNewAsset ? EditNewAsset(
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
            binanceCurrencies,
        ) : null
    }

    function buildAsset(asset) {
        return (assetToEdit && (asset.id === assetToEdit.id))
            ? EditAsset(
                assetToEdit,
                userData, setUserData,
                isNewAssetAmountInvalid, setIsNewAssetAmountInvalid,
                newAssetAmount, setNewAssetAmount,
                newAssetName, setNewAssetName,
                isNewAssetNameInvalid, setIsNewAssetNameInvalid,
                stateReset,
            )
            : Asset(asset, <AssetControls
                editMode={false}
                onEditAsset={() => {
                    stateReset();
                    setAssetToEdit(asset);
                    setNewAssetAmount(asset.amount);
                    setNewAssetName(asset.name);
                }}
                onCancelOrDeleteAsset={() => {
                    stateReset();
                    setAssetToDelete(asset);
                }}
            />)
    }

    function buildAssets() {
        return (userData.assets || []).map(buildAsset)
    }

    function buildBinanceIntegrationAssets() {
        return userData.settings.binanceIntegrationEnabled && binanceUserData
            ? BinanceIntegrationAssets(binanceUserData)
            : null
    }

    function buildMonobankIntegrationAssets() {
        return userData.settings.monobankIntegrationEnabled && monobankUserData
            ? MonobankIntegrationAssets(monobankUserData)
            : null
    }

    function buildFirstPageStats() {
        return anyAssetExist ? FirstPageStats(
            userData, monobankUserData, binanceUserData, rates,
            firstPageChartType, setFirstPageChartType,
            firstPageChartView, setFirstPageChartView,
        ) : null
    }

    function buildFirstPage() {
        return <div className={"application-first-page"}>
            {buildNewAssetWindow()}
            {buildAssetDeleteWindow()}
            {buildSettingsWindow()}
            <div className={"assets-panel flex-box-centered flex-direction-column layer-1-themed-color"}>
                {buildAssetsManageButtons()}
                {buildEditNewAsset()}
                {buildAssets()}
                {buildBinanceIntegrationAssets()}
                {buildMonobankIntegrationAssets()}
            </div>
            {buildFirstPageStats()}
        </div>
    }

    function buildPage() {
        switch (selectedPageNumber) {
            case 0:
            default:
                return buildFirstPage()
        }
    }

    return (
        <div className={"application-box"}>{
            buildPage()
        }</div>
    );
}
