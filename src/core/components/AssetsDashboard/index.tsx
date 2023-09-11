import './index.css';

import React from "react";
import AssetsManageButtons from "./../assets/AssetsManageButtons";
import EditNewAsset from "./../assets/EditNewAsset";
import NewAssetWindow from "../NewAssetWindow";
import AssetDeleteWindow from "./../assets/AssetDeleteWindow";
import EditAsset from "./../assets/EditAsset";
import SettingsWindow from "../settings/SettingsWindow";
import FirstPageStats from "../FirstPageStats";
import Asset from "../assets/Asset";
import AssetControls from "../assets/AssetControls";
import {AccountInfo} from "../../integrations/binance/binanceApiClient";
import IntegrationAsset from "../assets/IntegrationAsset";
import {OkxAccount} from "../../integrations/okx/okxApiClient";
import MonobankUserData from "../../integrations/monobank/MonobankUserData";
import AssetDTO from "../../domain/AssetDTO";
import Props from "../Props";

export default function AssetsDashboard(props: Props) {

    function buildNewAssetWindow() {
        return props.showCreateNewAssetWindow ? NewAssetWindow(props) : null
    }

    function buildAssetDeleteWindow() {
        return props.assetToDelete ? AssetDeleteWindow(props) : null
    }

    function buildSettingsWindow() {
        return props.showConfigsWindow ? SettingsWindow(props) : null
    }

    function buildAssetsManageButtons() {
        return props.anyAssetExist ? AssetsManageButtons(props) : null
    }

    function buildEditNewAsset() {
        return !props.showCreateNewAssetWindow && props.creatingNewAsset ? EditNewAsset(props) : null
    }

    function buildAsset(asset: AssetDTO) {
        return (props.assetToEdit && (asset.id === props.assetToEdit.id))
            ? EditAsset(props)
            : Asset(asset, <AssetControls
                editMode={false}
                onEditAsset={() => {
                    props.stateReset();
                    props.setAssetToEdit(asset);
                    props.setNewAssetAmount(asset.amount);
                    props.setNewAssetName(asset.name);
                }}
                onCancelOrDeleteAsset={() => {
                    props.stateReset();
                    props.setAssetToDelete(asset);
                }}
            />)
    }

    function buildAssets() {
        return (props.userData.assets || []).map(buildAsset)
    }

    function buildBinanceIntegrationAssets() {
        return props.userData.settings.binanceIntegrationEnabled && props.binanceUserData
            ? AccountInfo.getAllAssets(props.binanceUserData).map(IntegrationAsset)
            : null
    }

    function buildOkxIntegrationAssets() {
        return props.userData.settings.okxIntegrationEnabled && props.okxUserData
            ? OkxAccount.getAllAssets(props.okxUserData).map(IntegrationAsset)
            : null
    }

    function buildCcxtIntegrationAssets() {
        return Object.values(props.ccxtUserData)
            .reduce((merged, current) => {
                return merged.concat(current)
            }, [])
            .map(IntegrationAsset)
    }

    function buildMonobankIntegrationAssets() {
        return props.userData.settings.monobankIntegrationEnabled && props.monobankUserData
            ? MonobankUserData.getAllAssets(props.monobankUserData).map(IntegrationAsset)
            : null
    }

    function buildFirstPageStats() {
        return props.anyAssetExist ? FirstPageStats(props) : null
    }

    function buildFirstPage() {
        return <div className={"application-first-page"}>
            {buildNewAssetWindow()}
            {buildAssetDeleteWindow()}
            {buildSettingsWindow()}
            <div className={"assets-panel flex-box-centered flex-direction-column layer-1-themed-color"}>
                {buildAssetsManageButtons()}
                {buildEditNewAsset()}
                {buildAssets()}
                {buildBinanceIntegrationAssets()}
                {buildOkxIntegrationAssets()}
                {buildCcxtIntegrationAssets()}
                {buildMonobankIntegrationAssets()}
            </div>
            {buildFirstPageStats()}
        </div>
    }

    function buildPage() {
        switch (props.selectedPageNumber) {
            case 0:
            default:
                return buildFirstPage()
        }
    }

    return (
        <div className={"application-box"}>{
            buildPage()
        }</div>
    );
}
