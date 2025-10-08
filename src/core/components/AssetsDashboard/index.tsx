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
        return (props.userData.assets || []).map((asset) => (
            <React.Fragment key={asset.id}>
                {buildAsset(asset)}
            </React.Fragment>
        ))
    }

    function buildBinanceIntegrationAssets() {
        return props.userData.settings.binanceIntegrationEnabled && props.binanceUserData
            ? AccountInfo.getAllAssets(props.binanceUserData).map((asset, index) => (
                <React.Fragment key={`binance-${asset.currency}-${index}`}>
                    {IntegrationAsset(asset)}
                </React.Fragment>
            ))
            : null
    }

    function buildOkxIntegrationAssets() {
        return props.userData.settings.okxIntegrationEnabled && props.okxUserData
            ? OkxAccount.getAllAssets(props.okxUserData).map((asset, index) => (
                <React.Fragment key={`okx-${asset.currency}-${index}`}>
                    {IntegrationAsset(asset)}
                </React.Fragment>
            ))
            : null
    }

    function buildCcxtIntegrationAssets() {
        return Object.values(props.ccxtUserData)
            .reduce((merged, current) => {
                return merged.concat(current)
            }, [])
            .map((asset, index) => (
                <React.Fragment key={`ccxt-${asset.currency}-${index}`}>
                    {IntegrationAsset(asset)}
                </React.Fragment>
            ))
    }

    function buildMetaMaskIntegrationAssets() {
        return props.metaMaskSettingsEnabled
            ? (props.metaMaskAssets || []).map((asset, index) => (
                <React.Fragment key={`metamask-${asset.currency}-${index}`}>
                    {IntegrationAsset(asset)}
                </React.Fragment>
            ))
            : null
    }

    function buildMonobankIntegrationAssets() {
        return props.userData.settings.monobankIntegrationEnabled && props.monobankUserData
            ? MonobankUserData.getAllAssets(props.monobankUserData).map((asset, index) => (
                <React.Fragment key={`monobank-${asset.currency}-${index}`}>
                    {IntegrationAsset(asset)}
                </React.Fragment>
            ))
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
                {buildMetaMaskIntegrationAssets()}
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
