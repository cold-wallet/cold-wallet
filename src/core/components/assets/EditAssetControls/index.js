import './index.css';
import AssetDataValidator from "../../../utils/AssetDataValidator";
import AssetDTO from "../../../domain/AssetDTO";
import React from "react";

export default function EditAssetControls(
    assetToEdit,
    setAssetToEdit,
    newAssetAmount,
    setAssetAmount,
    newAssetName,
    setAssetName,
    setIsAssetAmountInvalid,
    setIsAssetNameInvalid,
    userData,
    setUserData,
) {
    const buildAcceptAssetButton = () => {
        return (
            <div key={1}
                 onClick={() => {
                     if (!AssetDataValidator.isAssetAmountValid(newAssetAmount)) {
                         setIsAssetAmountInvalid(true);
                     } else if (!AssetDataValidator.isAssetNameValid(newAssetName)) {
                         setIsAssetNameInvalid(true);
                     } else {
                         let userDataNew = {...userData}
                         if (!userDataNew.assets) {
                             userDataNew.assets = [];
                         }
                         userDataNew.assets = userDataNew.assets.map(asset => {
                             if (asset.id === assetToEdit.id) {
                                 return new AssetDTO(assetToEdit.id, assetToEdit.currency, newAssetAmount,
                                     newAssetName, assetToEdit.decimalScale);
                             } else {
                                 return asset;
                             }
                         });
                         setUserData(userDataNew);
                         setAssetAmount(null);
                         setAssetName(null);
                         setIsAssetAmountInvalid(false);
                         setIsAssetNameInvalid(false);
                         setAssetToEdit(null)
                     }
                 }}
                 className="asset-row-controls-button asset-row-button-accept button positive-button">✔</div>
        )
    }

    const buildCancelAssetButton = () => {
        return (
            <div key={2}
                 onClick={() => {
                     setAssetAmount(null);
                     setAssetName(null);
                     setAssetToEdit(null);
                     setIsAssetNameInvalid(false);
                     setIsAssetAmountInvalid(false);
                 }}
                 className="asset-row-controls-button button negative-button">✖</div>
        )
    }

    return (
        <div className={"asset-row-controls flex-box-centered flex-direction-row"}>
            {buildAcceptAssetButton()}
            {buildCancelAssetButton()}
        </div>
    )
}
