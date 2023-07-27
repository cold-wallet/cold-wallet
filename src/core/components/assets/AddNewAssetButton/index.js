import React from "react";
import './index.css';

export default function AddNewAssetButton(
    setShowCreateNewAssetWindow,
    setCreatingNewAsset,
    setAssetToEdit,
    setNewAssetAmount,
    setNewAssetName,
    setIsNewAssetAmountInvalid,
    setIsNewAssetNameInvalid,
) {
    const addNewAssetButtonClicked = () => {
        setShowCreateNewAssetWindow(true);
        setCreatingNewAsset(true);
        setAssetToEdit(null);
        setNewAssetAmount(null);
        setNewAssetName(null);
        setIsNewAssetAmountInvalid(false);
        setIsNewAssetNameInvalid(false);
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
