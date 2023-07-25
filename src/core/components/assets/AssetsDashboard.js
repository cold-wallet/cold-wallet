import React from "react";
import AddNewAssetButton from "./AddNewAssetButton";
import Asset from "./Asset";
import EditNewAsset from "./EditNewAsset";
import NewAssetWindow from "./NewAssetWindow";
import AssetDeleteWindow from "./AssetDeleteWindow";

export default function AssetsDashboard(
    showCreateNewAssetWindow,
    creatingNewAsset,
    setShowCreateNewAssetWindow,
    setCreatingNewAsset,
    userData,
    setNewAssetValue,
    setNewAssetCurrency,
    setNewAssetName,
    newAssetValue,
    setIsNewAssetInvalid,
    newAssetName,
    setIsNewAssetNameInvalid,
    newAssetCurrency,
    setUserData,
    isNewAssetInvalid,
    isNewAssetNameInvalid,
    monobankCurrencies,
    binanceCurrencies,
    assetToDelete,
    setAssetToDelete,
) {
    return (
        <div className={"application-box flex-box flex-direction-row"}>
            {showCreateNewAssetWindow && NewAssetWindow(
                setNewAssetCurrency,
                setShowCreateNewAssetWindow,
                monobankCurrencies,
                binanceCurrencies,
            )}
            {assetToDelete && AssetDeleteWindow(assetToDelete, setAssetToDelete,)}
            <div className={"assets-panel flex-box-centered flex-direction-column layer-1-themed-color"}>
                {AddNewAssetButton(setShowCreateNewAssetWindow, setCreatingNewAsset)}
                {!showCreateNewAssetWindow && creatingNewAsset && EditNewAsset(
                    newAssetCurrency,
                    isNewAssetInvalid,
                    setIsNewAssetInvalid,
                    setNewAssetValue,
                    newAssetName,
                    setNewAssetName,
                    isNewAssetNameInvalid,
                    setNewAssetCurrency,
                    setShowCreateNewAssetWindow,
                    newAssetValue,
                    setIsNewAssetNameInvalid,
                    userData,
                    setUserData,
                    setCreatingNewAsset,
                )}
                {(userData.assets || []).map(asset => Asset(
                    asset,
                    setAssetToDelete,
                ))}
            </div>
        </div>
    );
}
