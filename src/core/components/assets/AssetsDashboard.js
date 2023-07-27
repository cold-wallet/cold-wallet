import React from "react";
import AddNewAssetButton from "./AddNewAssetButton";
import Asset from "./Asset";
import EditNewAsset from "./EditNewAsset";
import NewAssetWindow from "./NewAssetWindow";
import AssetDeleteWindow from "./AssetDeleteWindow";
import EditAsset from "./EditAsset";

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
) {
    return (
        <div className={"application-box flex-box flex-direction-row"}>
            {showCreateNewAssetWindow && NewAssetWindow(
                setNewAssetCurrency,
                setShowCreateNewAssetWindow,
                monobankCurrencies,
                binanceCurrencies,
            )}
            {assetToDelete && AssetDeleteWindow(
                assetToDelete, setAssetToDelete, userData, setUserData, setShowCreateNewAssetWindow,
                setCreatingNewAsset,
            )}
            <div className={"assets-panel flex-box-centered flex-direction-column layer-1-themed-color"}>
                {AddNewAssetButton(
                    setShowCreateNewAssetWindow,
                    setCreatingNewAsset,
                    setAssetToEdit,
                    setNewAssetAmount,
                    setNewAssetName,
                )}
                {!showCreateNewAssetWindow && creatingNewAsset && EditNewAsset(
                    newAssetCurrency,
                    setNewAssetCurrency,
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
                )}
                {(userData.assets || []).map(asset => (assetToEdit && (asset.id === assetToEdit.id))
                    ? EditAsset(
                        assetToEdit,
                        setAssetToEdit,
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
                    )
                    : Asset(
                        asset,
                        setAssetToDelete,
                        setAssetToEdit,
                        setNewAssetAmount,
                        setNewAssetName,
                        setIsNewAssetNameInvalid,
                        setIsNewAssetAmountInvalid,
                    ))}
            </div>
        </div>
    );
}
