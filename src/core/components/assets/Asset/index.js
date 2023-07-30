import './index.css';
import React from "react";
import NumberFormat from "react-number-format";
import noExponents from "./../../../utils/noExponents";
import AssetControls from "./../AssetControls";

export default function Asset(
    asset,
    setAssetToDelete,
    setAssetToEdit,
    setNewAssetAmount,
    setNewAssetName,
    stateReset,
) {
    let decimalScale = asset.decimalScale || 8;

    const onEditAsset = (asset) => {
        stateReset();
        setAssetToEdit(asset);
        setNewAssetAmount(asset.amount);
        setNewAssetName(asset.name);
    }

    const onDeleteAsset = (asset) => {
        stateReset();
        setAssetToDelete(asset);
    }

    return (
        <div key={asset.id} className={"asset-row flex-box-centered flex-direction-row layer-2-themed-color"}>
            <div className={"asset-item-value"}>
                <NumberFormat
                    allowLeadingZeros={false}
                    allowNegative={false}
                    isNumericString={true}
                    displayType={"text"}
                    decimalScale={decimalScale}
                    thousandSeparator={true}
                    value={noExponents(asset.amount)}
                    renderText={value => (
                        <div className={"asset-item-value-input"}>{value}</div>
                    )}
                />
            </div>
            <div className={"asset-item-name text-label"}
                 title={asset.normalizedName}>{asset.normalizedName}</div>
            <AssetControls
                editMode={false}
                onEditAsset={() => onEditAsset(asset)}
                onCancelOrDeleteAsset={() => onDeleteAsset(asset)}
            />
        </div>
    )
}
