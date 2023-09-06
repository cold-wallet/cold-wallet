import './index.css';
import React from "react";
import AssetDTO from "../../../domain/AssetDTO";
import AssetEditor from "../AssetEditor";
import Props from "../../Props";

export default function EditAsset(props: Props) {
    if (props.newAssetName === null) {
        props.setNewAssetName(props.assetToEdit?.name || null)
    }
    if (props.newAssetAmount === null) {
        props.setNewAssetAmount(props.assetToEdit?.amount || null)
    }

    const onAcceptAsset = () => {
        let userDataNew = {...props.userData}
        if (!userDataNew.assets) {
            userDataNew.assets = [];
        }
        userDataNew.assets = userDataNew.assets.map(asset => {
            if (asset.id === props.assetToEdit?.id) {
                return new AssetDTO(props.assetToEdit?.id, props.assetToEdit?.currency,
                    props.newAssetAmount || "0", props.newAssetName || "",
                    props.assetToEdit?.decimalScale, props.assetToEdit?.type);
            } else {
                return asset;
            }
        });
        props.setUserData(userDataNew);
        onCancelAsset();
    }

    const onCancelAsset = () => {
        props.stateReset();
    }

    return (
        <AssetEditor props={props}
                     onAccept={onAcceptAsset}
                     onCancel={onCancelAsset}
        />
    )
}
