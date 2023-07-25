import AssetDataValidator from "../../utils/AssetDataValidator";
import AssetDTO from "../../domain/AssetDTO";
import uuidGenerator from "../../utils/uuid-generator";
import React from "react";

export default function EditNewAssetControls(
    afterDecimalPoint,
    setNewAssetValue,
    setNewAssetCurrency,
    setNewAssetName,
    setShowCreateNewAssetWindow,
    newAssetValue,
    setIsNewAssetInvalid,
    newAssetName,
    setIsNewAssetNameInvalid,
    userData,
    newAssetCurrency,
    setUserData,
    setCreatingNewAsset,
) {
    const buildAcceptNewAssetButton = () => {
        return (
            <div key={1}
                 onClick={event => {
                     if (!AssetDataValidator.isAssetValueValid(newAssetValue)) {
                         setIsNewAssetInvalid(true);
                     } else if (!AssetDataValidator.isAssetNameValid(newAssetName)) {
                         setIsNewAssetNameInvalid(true);
                     } else {
                         let userDataNew = {...userData}
                         if (!userDataNew.assets) {
                             userDataNew.assets = [];
                         }
                         let newAsset = new AssetDTO(uuidGenerator.generateUUID(), newAssetCurrency, newAssetValue,
                             newAssetName, afterDecimalPoint);
                         userDataNew.assets.unshift(newAsset)
                         setUserData(userDataNew);
                         setNewAssetValue(null);
                         setNewAssetName("");
                         setNewAssetCurrency(null);
                         setShowCreateNewAssetWindow(false);
                         setIsNewAssetInvalid(false);
                         setCreatingNewAsset(false);
                     }
                 }}
                 className="asset-row-controls-button asset-row-button-accept button positive-button">✔</div>
        )
    }

    const buildCancelNewAssetButton = () => {
        return (
            <div key={2}
                 onClick={event => {
                     setNewAssetValue(null);
                     setNewAssetCurrency(null);
                     setNewAssetName("");
                     setShowCreateNewAssetWindow(true);
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
