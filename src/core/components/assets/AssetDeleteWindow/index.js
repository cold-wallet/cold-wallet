import React from "react";
import './index.css'

export default function AssetDeleteWindow(assetToDelete, setAssetToDelete,) {
    function getCurrency(assetToDelete) {
        return (assetToDelete.name.indexOf(assetToDelete.currency) === -1)
            ? `${assetToDelete.currency} ` : "";
    }

    return (
        <div className="modal-window-box">
            <div className="modal-window-shadow clickable"/>
            <div className={"confirm-delete-asset-window modal-window flex-box" +
            " flex-direction-column layer-1-themed-color"}>
                <div className="confirm-delete-asset-window-headline flex-box flex-direction-row">
                    <div className="confirm-delete-asset-window-close-button button neutral-button">x</div>
                </div>
                <div className="confirm-delete-asset-text text-label">{
                    `Delete ${assetToDelete.amount} ` + getCurrency(assetToDelete) + `${assetToDelete.name}?`
                }</div>
                <div className="confirm-delete-asset-buttons flex-box-centered flex-direction-row">
                    <div className="confirm-delete-asset-button button negative-button">Delete</div>
                    <div className="confirm-delete-asset-button button neutral-button">Cancel</div>
                </div>
            </div>
        </div>
    )
}
