import AssetDTO, { AssetType } from '../domain/AssetDTO';
import { AccountInfo, SpotAccount } from '../integrations/binance/binanceApiClient';
import { assetRefreshScope, refreshMinGap, scopeLabel, sourceLabelOf } from './scopes';
import { assetView, sourceView } from './describe';
import { begin, fail, succeed } from './refreshState';
import { binanceFailKind } from '../integrations/binance/BinanceLoader';
import { okxFailKind } from '../integrations/okx/OkxLoader';
import { monobankFailKind } from '../integrations/monobank/MonobankLoader';
import { ccxtFailKind } from '../integrations/ccxt/CcxtLoader';
import { withOkxSpotCurrency, OkxAccount } from '../integrations/okx/okxApiClient';

const binance = (id: string, currency: string) =>
  new AssetDTO(id, currency, '1', currency, 8, AssetType.crypto, true);
const okx = (id: string, currency: string) =>
  new AssetDTO(id, currency, '2', currency, 8, AssetType.crypto, false, false, true);
const metamask = (id: string) =>
  new AssetDTO(id, 'USDC', '3', 'USDC', 6, AssetType.crypto, false, false, false, false, null, true);
const monobank = new AssetDTO('monobank_1', 'UAH', '100', 'UAH', 2, AssetType.fiat, false, true);
const kraken = new AssetDTO('kraken_BTC SPOT', 'BTC', '1', 'BTC SPOT', 8, AssetType.crypto, false, false, false, true, 'kraken');

describe('which part a holding refresh loads', () => {
  const info = new AccountInfo(
    { accountType: 'SPOT', balances: [binance('binance_SPOT_BTC', 'BTC')] } as unknown as SpotAccount,
    [], [], [], [], [binance('binance_funding_USDT', 'USDT')],
  );
  info.savingsFlexible = [binance('binance_simple_earn_flexible_ETH', 'ETH')];

  it('Binance: the section the holding came from', () => {
    expect(assetRefreshScope(binance('binance_SPOT_BTC', 'BTC'), info)).toBe('binance/spot');
    expect(assetRefreshScope(binance('binance_funding_USDT', 'USDT'), info)).toBe('binance/funding');
    expect(assetRefreshScope(binance('binance_simple_earn_flexible_ETH', 'ETH'), info)).toBe('binance/savingsFlexible');
    expect(assetRefreshScope(binance('binance_gone_X', 'X'), info)).toBeNull();
  });

  it('OKX: one coin of the trading account, or the whole sub-account', () => {
    expect(assetRefreshScope(okx('okx_spot_BTC', 'BTC'), null)).toBe('okx/spot/BTC');
    expect(assetRefreshScope(okx('okx_sub_ETH', 'ETH'), null)).toBe('okx/sub');
  });

  it('MetaMask: the token itself; Monobank and ccxt exchanges: none (they load everything at once)', () => {
    expect(assetRefreshScope(metamask('metamask USDC base 0xabc'), null)).toBe('metamask/metamask USDC base 0xabc');
    expect(assetRefreshScope(monobank, null)).toBeNull();
    expect(assetRefreshScope(kraken, null)).toBeNull();
  });
});

describe('names and limits', () => {
  it('names scopes the way the dashboard does', () => {
    expect(scopeLabel('binance/futuresUsdM')).toBe('USDⓈ-M futures');
    expect(scopeLabel('okx/sub')).toBe('Sub-account');
    expect(scopeLabel('okx/spot/BTC')).toBe('BTC');
    expect(scopeLabel('metamask/metamask USDC base 0xabc')).toBe('USDC on base');
    expect(sourceLabelOf('ccxt:kraken')).toBe('Kraken');
    expect(sourceLabelOf('prices/okx')).toBe('Prices');
  });

  it('Monobank and Binance staking/Earn are limited to one request a minute; the rest are not', () => {
    expect(refreshMinGap('monobank')).toBe(60_000);
    expect(refreshMinGap('prices/monobank')).toBe(60_000);
    expect(refreshMinGap('binance/savingsFlexible')).toBe(60_000);
    expect(refreshMinGap('binance/spot')).toBe(0);
    expect(refreshMinGap('ccxt:kraken')).toBe(0);
  });
});

describe('when a failure is retried', () => {
  it('Binance: throttling is retried; an error on spot means the keys, on another section that it is not offered', () => {
    expect(binanceFailKind('spot', new TypeError('Failed to fetch'))).toBe('retry');
    expect(binanceFailKind('spot', Object.assign(new Error('Invalid API-key'), { code: -2015 }))).toBe('fatal');
    expect(binanceFailKind('futuresUsdM', Object.assign(new Error('Invalid API-key'), { code: -2015 }))).toBe('unavailable');
    expect(binanceFailKind('funding', Object.assign(new Error('Too many requests'), { code: -1003 }))).toBe('retry');
  });

  it('OKX: network errors and rate limits are retried, API errors are not', () => {
    expect(okxFailKind('okx/spot', { code: 'ERR_NETWORK', message: 'Network Error' })).toBe('retry');
    expect(okxFailKind('okx/spot', { code: '50011', msg: 'Rate limit reached' })).toBe('retry');
    expect(okxFailKind('okx/spot', { code: '50111', msg: 'Invalid OK-ACCESS-KEY' })).toBe('fatal');
    expect(okxFailKind('okx/sub', { code: '58117', msg: 'Sub-account does not exist' })).toBe('unavailable');
  });

  it('Monobank: a rejected token is not retried; a rate limit or network error is', () => {
    expect(monobankFailKind(403)).toBe('fatal');
    expect(monobankFailKind(429)).toBe('retry');
    expect(monobankFailKind(undefined)).toBe('retry');
  });

  it('ccxt: rejected keys and unknown exchanges are not retried', () => {
    expect(ccxtFailKind(401)).toBe('fatal');
    expect(ccxtFailKind(404)).toBe('fatal');
    expect(ccxtFailKind(0)).toBe('retry');
  });
});

describe('OKX single-coin refresh', () => {
  it('replaces only that coin, and drops it when none is left', () => {
    const account = new OkxAccount([okx('okx_spot_BTC', 'BTC'), okx('okx_spot_ETH', 'ETH')], [okx('okx_sub_BTC', 'BTC')]);
    const updated = withOkxSpotCurrency(account, 'BTC', [okx('okx_spot_BTC', 'BTC')]);
    expect(updated.spotAccountBalances?.map((a) => a.currency).sort()).toEqual(['BTC', 'ETH']);
    expect(updated.subAccountBalances).toHaveLength(1);
    const sold = withOkxSpotCurrency(account, 'BTC', []);
    expect(sold.spotAccountBalances?.map((a) => a.currency)).toEqual(['ETH']);
  });
});

describe('what the buttons show', () => {
  const T = 1_000_000;

  it('Monobank waits out its minute after a manual refresh, with a countdown', () => {
    const s = succeed(begin({}, ['monobank'], T, true), 'monobank', T + 500);
    const v = sourceView(s, 'monobank', T + 18_000);
    expect(v.blockedUntil).toBe(T + 60_000);
    expect(v.title).toMatch(/available in 42 s/);
    expect(sourceView(s, 'monobank', T + 60_000).blockedUntil).toBe(0);
  });

  it('Binance never waits as a whole: its core sections can always load', () => {
    let s = succeed(begin({}, ['binance/spot', 'binance/savingsFlexible'], T, true), 'binance/spot', T);
    s = succeed(s, 'binance/savingsFlexible', T);
    expect(sourceView(s, 'binance', T + 5_000).blockedUntil).toBe(0);
    // but a Simple Earn holding's own button does
    const earn = binance('binance_simple_earn_flexible_ETH', 'ETH');
    expect(earn.isBinanceAsset).toBe(true);
    expect(assetView(s, 'binance/savingsFlexible', T + 5_000).blockedUntil).toBe(T + 60_000);
  });

  it('the header spins while anything loads, amber when a part is retried, red when one will not load', () => {
    let s = begin({}, ['prices/coingecko'], T, false);
    expect(sourceView(s, '', T)).toMatchObject({ spinning: true, tone: 'idle' });
    s = fail(s, 'prices/coingecko', T + 100, '429', 'retry');
    expect(sourceView(s, '', T + 200)).toMatchObject({ spinning: true, tone: 'warn' });
    expect(sourceView(s, '', T + 200).title).toMatch(/CoinGecko prices failed: 429 · retrying in 15 s/);
    s = fail(begin(s, ['okx/spot'], T, false), 'okx/spot', T + 300, 'Invalid OK-ACCESS-KEY', 'fatal');
    expect(sourceView(s, '', T + 400).tone).toBe('error');
    expect(sourceView(s, '', T + 400).blockedUntil).toBe(0);
  });

  it('a holding spins while its section loads and says when it last loaded', () => {
    let s = begin({}, ['okx/spot'], T, false);
    expect(assetView(s, 'okx/spot/BTC', T).spinning).toBe(true);
    s = succeed(s, 'okx/spot', T + 1_000);
    const v = assetView(s, 'okx/spot/BTC', T + 3 * 60_000);
    expect(v.spinning).toBe(false);
    expect(v.title).toMatch(/Updated 3 min ago/);
  });
});
