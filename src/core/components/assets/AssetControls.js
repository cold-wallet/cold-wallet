import React from "react";

export default function AssetControls(
    asset,
    setAssetToDelete,
    setAssetToEdit,
    setNewAssetAmount,
    setNewAssetName,
    setIsAssetNameInvalid,
    setIsAssetAmountInvalid,
    setCreatingNewAsset,
) {
    const EditAssetButton = (asset) => {
        return (
            <div className="asset-row-controls-button button neutral-button"
                 onClick={() => {
                     setAssetToEdit(asset);
                     setNewAssetAmount(asset.amount);
                     setNewAssetName(asset.name);
                     setCreatingNewAsset(false);
                 }}>✎</div>
        )
    }

    const DeleteAssetButton = (asset) => {
        return (
            <div className="asset-row-controls-button button negative-button"
                 onClick={() => {
                     setAssetToDelete(asset);
                     setNewAssetAmount(null);
                     setNewAssetName(null);
                     setAssetToEdit(null);
                     setIsAssetNameInvalid(false);
                     setIsAssetAmountInvalid(false);
                     setCreatingNewAsset(false);
                 }}>✖</div>
        )
    }

    return (
        <div className={"asset-row-controls flex-box-centered flex-direction-row"}>
            {EditAssetButton(asset)}
            {DeleteAssetButton(asset)}
        </div>
    )
}
