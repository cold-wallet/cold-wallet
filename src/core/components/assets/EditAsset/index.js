import './index.css';
import React from "react";
import AssetDTO from "../../../domain/AssetDTO";
import AssetEditor from "../AssetEditor";

export default function EditAsset(
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
) {
    if (newAssetName === null) {
        setNewAssetName(assetToEdit.name)
    }
    if (newAssetAmount === null) {
        setNewAssetAmount(assetToEdit.amount)
    }

    const onAcceptAsset = () => {
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
        onCancelAsset();
    }

    const onCancelAsset = () => {
        stateReset();
    }

    return (
        <AssetEditor
            key={assetToEdit.id}
            id={assetToEdit.id}
            newAssetAmount={newAssetAmount}
            setNewAssetAmount={setNewAssetAmount}
            isNewAssetAmountInvalid={isNewAssetAmountInvalid}
            setIsNewAssetAmountInvalid={setIsNewAssetAmountInvalid}
            newAssetName={newAssetName}
            setNewAssetName={setNewAssetName}
            isNewAssetNameInvalid={isNewAssetNameInvalid}
            setIsNewAssetNameInvalid={setIsNewAssetNameInvalid}
            decimalScale={assetToEdit.decimalScale}
            defaultAmount={assetToEdit.amount}
            assetCurrency={assetToEdit.currency}
            onAccept={onAcceptAsset}
            onCancel={onCancelAsset}
        />
    )
}
