import AssetDTO, { AssetType } from '../domain/AssetDTO';
import UserData, { IntegrationSettingsData } from '../domain/UserData';
import type { CcxtAccountsData } from '../integrations/ccxt/CcxtLoader';
import { anyHoldingExists, collectHoldings, enabledCcxtHoldings } from './holdings';

const ccxtAsset = (exchange: string, currency: string) =>
  new AssetDTO(`${exchange}_${currency} SPOT`, currency, '1', `${currency} SPOT`, 8, AssetType.crypto, false, false, false, true, exchange);
const integration = (enabled: boolean) => ({ enabled, apiKey: 'k', apiSecret: 's', password: null, additionalSetting: null } as IntegrationSettingsData);
const user = (integrations: Record<string, IntegrationSettingsData>) => {
  const u = new UserData();
  u.settings.integrations = integrations;
  u.assets = [new AssetDTO('m1', 'EUR', '10', 'Cash', 2, AssetType.fiat)];
  return u;
};
// balances saved on the device by the last sync, for both exchanges
const saved = { kraken: [ccxtAsset('kraken', 'BTC')], bybit: [ccxtAsset('bybit', 'ETH'), ccxtAsset('bybit', 'SOL')] };

describe('ccxt holdings', () => {
  it('shows the exchanges switched on', () => {
    const u = user({ kraken: integration(true), bybit: integration(true) });
    expect(enabledCcxtHoldings(u, saved).map((a) => a.currency)).toEqual(['BTC', 'ETH', 'SOL']);
  });

  it('drops an exchange as soon as it is switched off, before the next sync clears its saved balances', () => {
    const u = user({ kraken: integration(true), bybit: integration(false) });
    expect(enabledCcxtHoldings(u, saved).map((a) => a.currency)).toEqual(['BTC']);
  });

  it('ignores saved balances of an exchange with no settings at all', () => {
    expect(enabledCcxtHoldings(user({}), saved)).toEqual([]);
  });

  it('the dashboard list leaves out a switched-off exchange but keeps manual holdings', () => {
    const all = collectHoldings({
      userData: user({ kraken: integration(false), bybit: integration(true) }),
      binanceUserData: null, okxUserData: null, monobankUserData: null,
      metaMaskSettingsEnabled: false, metaMaskAssets: null,
      ccxtUserData: saved,
    });
    expect(all.map((a) => a.currency)).toEqual(['EUR', 'ETH', 'SOL']);
  });
});

describe('anyHoldingExists', () => {
  const empty = () => { const u = user({}); u.assets = []; return u; };
  const exists = (u: UserData, ccxt: CcxtAccountsData = saved) => anyHoldingExists(u, null, null, null, ccxt);

  it('counts a manual asset', () => {
    expect(exists(user({}), {})).toBe(true);
  });

  it('counts balances of a switched-on exchange only', () => {
    const on = empty(); on.settings.integrations = { kraken: integration(true) };
    const off = empty(); off.settings.integrations = { kraken: integration(false), bybit: integration(false) };
    expect(exists(on)).toBe(true);
    expect(exists(off)).toBe(false);
    expect(exists(empty())).toBe(false);
  });

  it('a switched-on exchange with nothing left on it is not a holding', () => {
    const on = empty(); on.settings.integrations = { kraken: integration(true) };
    expect(exists(on, { kraken: [] })).toBe(false);
  });
});
