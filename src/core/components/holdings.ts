// holdings.ts — every holding the dashboard shows: manual assets plus each connected integration.
// Shared by ColdWallet (is any price still missing?) and the dashboard (what to list and value).
import AssetDTO from "../domain/AssetDTO";
import UserData from "../domain/UserData";
import type { CcxtAccountsData } from "../integrations/ccxt/CcxtLoader";
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
    ccxtUserData: CcxtAccountsData;
}

/** Holdings of the ccxt exchanges switched on in settings. An exchange that was switched off keeps
 *  its last balances on the device until the next sync drops them, and they mustn't show meanwhile
 *  (Binance, OKX and Monobank are gated the same way). */
export function enabledCcxtHoldings(userData: UserData, ccxtUserData: CcxtAccountsData): AssetDTO[] {
    const integrations = userData.settings.integrations || {};
    return Object.entries(ccxtUserData)
        .filter(([exchange]) => integrations[exchange]?.enabled)
        .flatMap(([, assets]) => assets);
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
    return assets.concat(enabledCcxtHoldings(s.userData, s.ccxtUserData));
}
