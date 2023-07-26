import React from "react";
import './index.css'

export default function AssetDeleteWindow(
    assetToDelete,
    setAssetToDelete,
    userData,
    setUserData,
    setShowCreateNewAssetWindow,
    setCreatingNewAsset,
) {
    const cancel = () => {
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

    return (
        <div className="modal-window-box">
            <div onClick={cancel}
                 className="modal-window-shadow clickable"/>
            <div className={"confirm-delete-asset-window modal-window flex-box" +
            " flex-direction-column layer-1-themed-color"}>
                <div className="confirm-delete-asset-window-headline flex-box flex-direction-row">
                    <div onClick={cancel}
                         className="confirm-delete-asset-window-close-button button neutral-button">x
                    </div>
                </div>
                <div className="confirm-delete-asset-text text-label">{
                    `Delete ${assetToDelete.amount} ` + assetToDelete.normalizedName + `${assetToDelete.name}?`
                }</div>
                <div className="confirm-delete-asset-buttons flex-box-centered flex-direction-row">
                    <div onClick={deleteAsset}
                         className="confirm-delete-asset-button button negative-button">Delete
                    </div>
                    <div onClick={cancel}
                         className="confirm-delete-asset-button button neutral-button">Cancel
                    </div>
                </div>
            </div>
        </div>
    )
}
