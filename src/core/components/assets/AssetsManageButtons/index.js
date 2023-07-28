import React from "react";
import './index.css';
import PositiveButton from "../../buttons/PositiveButton";

export default function AssetsManageButtons(
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
            <PositiveButton onClick={addNewAssetButtonClicked}
                            className={"add-new-asset-button layer-3-themed-color"}
            >+</PositiveButton>
            <div className="add-new-asset-text text-label">Add new asset</div>
        </div>
    )
}
