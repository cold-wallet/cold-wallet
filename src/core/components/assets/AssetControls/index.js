import './index.css';
import React from "react";
import EditButton from "../../buttons/EditButton";
import CancelOrDeleteButton from "../../buttons/CancelOrDeleteButton";
import AcceptButton from "../../buttons/AcceptButton";

export default function AssetControls({editMode, onEditAsset, onCancelOrDeleteAsset,}) {
    return (
        <div className={"asset-row-controls flex-box-centered flex-direction-row"}>
            {editMode
                ? <AcceptButton onClick={onEditAsset}/>
                : <EditButton onClick={onEditAsset}/>
            }
            <CancelOrDeleteButton onClick={onCancelOrDeleteAsset}/>
        </div>
    )
}
