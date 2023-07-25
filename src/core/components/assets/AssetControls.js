import React from "react";

export default function AssetControls(asset, setAssetToDelete,) {
    const EditAssetButton = (asset) => {
        return (
            <div
                className="asset-row-controls-button button neutral-button">✎</div>
        )
    }

    const DeleteAssetButton = (asset) => {
        return (
            <div onClick={event => setAssetToDelete(asset)}
                 className="asset-row-controls-button button negative-button">✖</div>
        )
    }

    return (
        <div className={"asset-row-controls flex-box-centered flex-direction-row"}>
            {EditAssetButton(asset)}
            {DeleteAssetButton(asset)}
        </div>
    )
}
