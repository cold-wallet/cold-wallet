import React from "react";

export default function AddNewAssetButton(
    setShowCreateNewAssetWindow,
    setCreatingNewAsset,
    setAssetToEdit,
    setNewAssetAmount,
    setNewAssetName,
) {
    const addNewAssetButtonClicked = () => {
        setShowCreateNewAssetWindow(true);
        setCreatingNewAsset(true);
        setAssetToEdit(null);
        setNewAssetAmount(null);
        setNewAssetName(null);
    }

    return (
        <div className="add-new-asset-row flex-box-centered flex-direction-row">
            <div onClick={addNewAssetButtonClicked}
                 className="add-new-asset-button button positive-button layer-3-themed-color">+
            </div>
            <div className="add-new-asset-text text-label">Add new asset</div>
        </div>
    )
}
