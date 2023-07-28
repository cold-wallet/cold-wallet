import React from "react";
import './index.css'
import ModalWindow from "../../ModalWindow";
import NegativeButton from "../../buttons/NegativeButton";
import NeutralButton from "../../buttons/NeutralButton";

export default function AssetDeleteWindow(
    assetToDelete,
    setAssetToDelete,
    userData,
    setUserData,
    setShowCreateNewAssetWindow,
    setCreatingNewAsset,
) {
    const onCancel = () => {
        setAssetToDelete(null);
    }

    const deleteAsset = () => {
        const userDataNew = {...userData};
        userDataNew.assets = userDataNew.assets.filter(asset => asset.id !== assetToDelete.id);
        setUserData(userDataNew);
        setAssetToDelete(null);

        if (!(userDataNew.assets.length)) {
            setCreatingNewAsset(true);
            setShowCreateNewAssetWindow(true);
        }
    }

    return <ModalWindow
        onCancel={onCancel}
        closeable={true}
        large={false}
        children={
            <div className="confirm-delete-asset-text text-label">{
                `Delete ${assetToDelete.amount} ${assetToDelete.normalizedName}?`
            }</div>
        }
        bottom={
            <div className="confirm-delete-asset-buttons flex-box-centered flex-direction-row layer-1-themed-color">
                <NegativeButton onClick={deleteAsset}
                                className="confirm-delete-asset-button">Delete
                </NegativeButton>
                <NeutralButton onClick={onCancel}
                               className="confirm-delete-asset-button">Cancel
                </NeutralButton>
            </div>
        }/>
}
