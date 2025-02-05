import React from "react";
import './index.css';
import PositiveButton from "../../buttons/PositiveButton";
import NeutralButton from "../../buttons/NeutralButton";
import SettingsIcon from './../../../../resources/images/icons8-settings.svg'
import AssetsTotalAmount from "../AssetsTotalAmount";
import Props from "../../Props";

export default function AssetsManageButtons(props: Props) {
    const addNewAssetButtonClicked = () => {
        props.stateReset();
        props.setShowCreateNewAssetWindow(true);
        props.setCreatingNewAsset(true);
    }

    const showConfigsWindow = () => {
        props.stateReset();
        props.setShowConfigsWindow(true);
    }

    return (<div className="add-new-asset-row flex-box flex-direction-row">
        <NeutralButton onClick={showConfigsWindow}
                       className={"show-configs-window-button"}
        ><SettingsIcon/></NeutralButton>
        <AssetsTotalAmount props={props}/>
        <PositiveButton onClick={addNewAssetButtonClicked}
                        className={"add-new-asset-button layer-3-themed-color"}
        >+</PositiveButton>
    </div>)
}
