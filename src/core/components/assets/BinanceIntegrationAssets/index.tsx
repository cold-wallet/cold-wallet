import './index.css';
import {AccountInfo} from "../../../integrations/binance/binanceApiClient";
import IntegrationAsset from "../IntegrationAsset";
import AssetDTO from "../../../domain/AssetDTO";


function buildIntegrationAssets(assets: AssetDTO[]) {
    return assets.map(IntegrationAsset)
}

export default function BinanceIntegrationAssets(binanceUserData: AccountInfo) {
    return (
        [
            binanceUserData.account?.balances || [],
            binanceUserData.marginIsolated || [],
            binanceUserData.marginCross || [],
            binanceUserData.futuresUsdM || [],
            binanceUserData.futuresCoinM || [],
            binanceUserData.funding || [],
            binanceUserData.lockedStaking || [],
            binanceUserData.lockedDeFiStaking || [],
            binanceUserData.flexibleDefiStaking || [],
            binanceUserData.liquidityFarming || [],
            binanceUserData.savingsFixed || [],
            binanceUserData.savingsFlexible || [],
        ].map(buildIntegrationAssets)
    )
}