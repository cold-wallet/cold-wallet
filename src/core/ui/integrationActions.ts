// redesign/integrationActions.ts — quick enable/disable from the integrations LIST.
// Unlike the per-integration config Save (which validates the typed inputs and then
// stateReset-closes the window), the list toggle is a shortcut for ALREADY-configured
// integrations: it validates the SAVED credentials and persists only the enabled flag,
// keeping the settings window open. Reuses the real service api-clients for validation.
import binanceApiClient from '../../integrations/binance/binanceApiClient';
import okxApiClient from '../../integrations/okx/okxApiClient';
import monobankApiClient from '../../integrations/monobank/monobankApiClient';
import ccxtConnector from '../../integrations/ccxt/ccxtConnector';
import Props from '../Props';

/** True when an integration already has saved credentials, so a quick toggle is meaningful. */
export function isConfigured(props: Props, key: string): boolean {
  const s = props.userData.settings;
  switch (key) {
    case 'binance': return !!(s.binanceIntegrationApiKey && s.binanceIntegrationApiSecret);
    case 'okx': return !!(s.okxIntegrationApiKey && s.okxIntegrationApiSecret && s.okxIntegrationPassPhrase);
    case 'monobank': return !!s.monobankIntegrationToken;
    case 'metamask': return true; // wallet connection, not inputs — always toggleable
    default: { const c = s.integrations && s.integrations[key]; return !!(c && c.apiKey && c.apiSecret); }
  }
}

/** Set the temporary (pending) enabled flag that drives the switch UI. */
export function setTempEnabled(props: Props, key: string, v: boolean): void {
  switch (key) {
    case 'binance': props.setBinanceSettingsEnabled(v); break;
    case 'okx': props.setOkxSettingsEnabled(v); break;
    case 'monobank': props.setMonobankSettingsEnabled(v); break;
    case 'metamask': props.setMetaMaskSettingsEnabled(v); break;
    default: { const set = new Set(props.enabledCcxtIntegrations); v ? set.add(key) : set.delete(key); props.setEnabledCcxtIntegrations(set); }
  }
}

/** Persist only the enabled flag to userData (keeps the settings window open). */
export function persistEnabled(props: Props, key: string, v: boolean): void {
  const nd = { ...props.userData };
  switch (key) {
    case 'binance': nd.settings.binanceIntegrationEnabled = v; break;
    case 'okx': nd.settings.okxIntegrationEnabled = v; break;
    case 'monobank': nd.settings.monobankIntegrationEnabled = v; break;
    default: {
      const integrations = { ...(nd.settings.integrations || {}) };
      if (integrations[key]) integrations[key] = { ...integrations[key], enabled: v };
      nd.settings.integrations = integrations;
    }
  }
  props.setUserData(nd);
}

/** Validate the SAVED credentials via the real API; loads the integration data on success. */
export async function validateSavedCredentials(props: Props, key: string): Promise<boolean> {
  const s = props.userData.settings;
  try {
    if (key === 'binance') {
      const info = await binanceApiClient.getUserInfoAsync(s.binanceIntegrationApiKey || '', s.binanceIntegrationApiSecret || '', props.binanceCurrencies, props.binanceUserData);
      if (info && info.account && info.account.balances) { props.setBinanceUserData(info); return true; }
      return false;
    }
    if (key === 'okx') {
      const info = await okxApiClient.getUserInfo(s.okxIntegrationApiKey || '', s.okxIntegrationApiSecret || '', s.okxIntegrationPassPhrase || '', s.okxIntegrationSubAccountName, props.okxCurrencies, props.okxUserData);
      if (info && (info.subAccountBalances || info.spotAccountBalances)) { props.setOkxUserData(info); return true; }
      return false;
    }
    if (key === 'monobank') {
      const resp = await monobankApiClient.getUserInfo(s.monobankIntegrationToken || '');
      if (resp && resp.success) { props.setMonobankUserData(resp.result); return true; }
      return false;
    }
    const cfg = s.integrations && s.integrations[key];
    if (!cfg) return false;
    const resp = await ccxtConnector.loadUserData(key, cfg.apiKey || '', cfg.apiSecret || null, cfg.password || null, cfg.additionalSetting || null);
    if (resp && resp.success) { const nd = { ...props.ccxtUserData }; nd[key] = resp.result || []; props.setCcxtUserData(nd); return true; }
    return false;
  } catch (e) {
    console.info(e);
    return false;
  }
}
