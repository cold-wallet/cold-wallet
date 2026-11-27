// holdings.ts — every holding the dashboard shows: manual assets plus each connected integration.
// Shared by ColdWallet (is any price still missing?) and the dashboard (what to list and value).
import AssetDTO from "../domain/AssetDTO";
import UserData from "../domain/UserData";
import { AccountInfo } from "../integrations/binance/binanceApiClient";
import { OkxAccount } from "../integrations/okx/okxApiClient";
import MonobankUserData from "../integrations/monobank/MonobankUserData";

export interface HoldingSources {
    userData: UserData;
    binanceUserData: AccountInfo | null;
    okxUserData: OkxAccount | null;
    monobankUserData: MonobankUserData | null;
    metaMaskSettingsEnabled: boolean;
    metaMaskAssets: AssetDTO[] | null;
    ccxtUserData: { [exchange: string]: AssetDTO[] };
}

export function collectHoldings(s: HoldingSources): AssetDTO[] {
    let assets = [...s.userData.assets];
    if (s.userData.settings.binanceIntegrationEnabled && s.binanceUserData) {
        assets = assets.concat(AccountInfo.getAllAssets(s.binanceUserData));
    }
    if (s.userData.settings.monobankIntegrationEnabled && s.monobankUserData) {
        assets = assets.concat(MonobankUserData.getAllAssets(s.monobankUserData));
    }
    if (s.userData.settings.okxIntegrationEnabled && s.okxUserData) {
        assets = assets.concat(OkxAccount.getAllAssets(s.okxUserData));
    }
    if (s.metaMaskSettingsEnabled && s.metaMaskAssets) {
        assets = assets.concat(s.metaMaskAssets);
    }
    return Object.values(s.ccxtUserData).reduce((merged, current) => merged.concat(current), assets);
}
