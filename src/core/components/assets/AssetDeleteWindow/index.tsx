import React from "react";
import './index.css'
import ModalWindow from "../../ModalWindow";
import NegativeButton from "../../buttons/NegativeButton";
import NeutralButton from "../../buttons/NeutralButton";
import Props from "../../Props";

export default function AssetDeleteWindow(props: Props) {
    const onCancel = () => {
        props.stateReset();
    }

    const deleteAsset = () => {
        const userDataNew = {...props.userData};
        userDataNew.assets = userDataNew.assets.filter(asset => asset.id !== props.assetToDelete?.id);
        props.setUserData(userDataNew);
        props.stateReset();

        let anyAssetExist = props.getAnyAssetExist(userDataNew, props.binanceUserData, props.okxUserData,
            props.monobankUserData, props.ccxtUserData)

        if (!anyAssetExist) {
            props.setCreatingNewAsset(true);
            props.setShowCreateNewAssetWindow(true);
        }
    }

    return <ModalWindow
        onCancel={onCancel}
        closeable={true}
        large={false}
        children={
            <div className="confirm-delete-asset-text text-label">{
                `Delete ${props.assetToDelete?.amount} ${props.assetToDelete?.normalizedName}?`
            }</div>
        }
        bottom={[
            <NegativeButton onClick={deleteAsset}
                            key={"delete"}
                            className="confirm-delete-asset-button">Delete
            </NegativeButton>,
            <NeutralButton onClick={onCancel}
                           key={"cancel"}
                           className="confirm-delete-asset-button">Cancel
            </NeutralButton>
        ]
        }/>
}
