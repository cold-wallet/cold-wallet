import AssetDataValidator from "../../utils/AssetDataValidator";
import AssetDTO from "../../domain/AssetDTO";
import uuidGenerator from "../../utils/uuid-generator";
import React from "react";

export default function EditNewAssetControls(
    afterDecimalPoint,
    newAssetAmount,
    setNewAssetAmount,
    newAssetCurrency,
    setNewAssetCurrency,
    newAssetName,
    setNewAssetName,
    setShowCreateNewAssetWindow,
    setIsNewAssetInvalid,
    setIsNewAssetNameInvalid,
    userData,
    setUserData,
    setCreatingNewAsset,
) {
    const buildAcceptNewAssetButton = (afterDecimalPoint) => {
        return (
            <div key={1}
                 onClick={() => {
                     if (!AssetDataValidator.isAssetAmountValid(newAssetAmount)) {
                         setIsNewAssetInvalid(true);
                     } else if (!AssetDataValidator.isAssetNameValid(newAssetName)) {
                         setIsNewAssetNameInvalid(true);
                     } else {
                         let userDataNew = {...userData}
                         if (!userDataNew.assets) {
                             userDataNew.assets = [];
                         }
                         let newAsset = new AssetDTO(uuidGenerator.generateUUID(), newAssetCurrency, newAssetAmount,
                             newAssetName, afterDecimalPoint);
                         userDataNew.assets.unshift(newAsset)
                         setUserData(userDataNew);
                         setNewAssetAmount(null);
                         setNewAssetName(false);
                         setNewAssetCurrency(null);
                         setShowCreateNewAssetWindow(false);
                         setIsNewAssetInvalid(false);
                         setIsNewAssetNameInvalid(false);
                         setCreatingNewAsset(false);
                     }
                 }}
                 className="asset-row-controls-button asset-row-button-accept button positive-button">✔</div>
        )
    }

    const buildCancelNewAssetButton = () => {
        return (
            <div key={2}
                 onClick={() => {
                     setNewAssetAmount(null);
                     setNewAssetCurrency(null);
                     setNewAssetName(null);
                     setIsNewAssetNameInvalid(false);
                     setIsNewAssetInvalid(false);
                     setCreatingNewAsset(!(userData.assets?.length));
                     setShowCreateNewAssetWindow(!(userData.assets?.length));
                 }}
                 className="asset-row-controls-button button negative-button">✖</div>
        )
    }

    return (
        <div className={"asset-row-controls flex-box-centered flex-direction-row"}>
            {buildAcceptNewAssetButton(afterDecimalPoint)}
            {buildCancelNewAssetButton()}
        </div>
    )
}
