import './index.css';

import React from "react";
import AddNewAssetButton from "../AssetsManageButtons";
import Asset from "./../Asset";
import EditNewAsset from "./../EditNewAsset";
import NewAssetWindow from "./../NewAssetWindow";
import AssetDeleteWindow from "./../AssetDeleteWindow";
import EditAsset from "./../EditAsset";

export default function AssetsDashboard(
    showCreateNewAssetWindow,
    setShowCreateNewAssetWindow,
    creatingNewAsset,
    setCreatingNewAsset,
    userData,
    newAssetAmount,
    setNewAssetAmount,
    newAssetCurrency,
    setNewAssetCurrency,
    newAssetName,
    setNewAssetName,
    isNewAssetAmountInvalid,
    setIsNewAssetAmountInvalid,
    isNewAssetNameInvalid,
    setIsNewAssetNameInvalid,
    setUserData,
    monobankCurrencies,
    binanceCurrencies,
    assetToDelete,
    setAssetToDelete,
    assetToEdit,
    setAssetToEdit,
    stateReset,
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
            <div className={"assets-panel flex-box-centered flex-direction-column layer-1-themed-color"}>
                {AddNewAssetButton(
                    setShowCreateNewAssetWindow,
                    setCreatingNewAsset,
                    stateReset,
                )}
                {!showCreateNewAssetWindow && creatingNewAsset && EditNewAsset(
                    newAssetCurrency,
                    isNewAssetAmountInvalid,
                    setIsNewAssetAmountInvalid,
                    newAssetAmount,
                    setNewAssetAmount,
                    newAssetName,
                    setNewAssetName,
                    setShowCreateNewAssetWindow,
                    isNewAssetNameInvalid,
                    setIsNewAssetNameInvalid,
                    userData,
                    setUserData,
                    setCreatingNewAsset,
                    stateReset,
                )}
                {(userData.assets || []).map(asset => (assetToEdit && (asset.id === assetToEdit.id))
                    ? EditAsset(
                        assetToEdit,
                        userData,
                        setUserData,
                        isNewAssetAmountInvalid,
                        setIsNewAssetAmountInvalid,
                        newAssetAmount,
                        setNewAssetAmount,
                        newAssetName,
                        setNewAssetName,
                        isNewAssetNameInvalid,
                        setIsNewAssetNameInvalid,
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
