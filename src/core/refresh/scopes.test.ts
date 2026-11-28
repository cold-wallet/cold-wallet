import AssetDTO, { AssetType } from '../domain/AssetDTO';
import { AccountInfo, SpotAccount } from '../integrations/binance/binanceApiClient';
import { assetRefreshScope, refreshMinGap, scopeLabel, sourceLabelOf } from './scopes';
import { assetView, headerView, sourceView } from './describe';
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
    // a token found under an older coin list (renamed since, or a bridged copy no longer listed)
    expect(assetRefreshScope(metamask('metamask MATIC polygon 0xabc'), null, () => false)).toBeNull();
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

  it('the header spins for the first price load and for clicks, not for the quiet price polls', () => {
    let s = begin({}, ['prices/binance'], T, false);
    expect(headerView(s, T).spinning).toBe(true);              // first load: nothing loaded yet
    s = succeed(s, 'prices/binance', T + 300);
    s = begin(s, ['prices/binance'], T + 15_000, false);
    expect(headerView(s, T + 15_100).spinning).toBe(false);    // a poll every 15 s: quiet
    s = begin(s, ['prices/binance'], T + 15_200, true);
    expect(headerView(s, T + 15_300).spinning).toBe(true);     // a click: the user is waiting
    s = succeed(succeed(s, 'prices/binance', T + 15_500), 'prices/binance', T + 15_600);
    expect(headerView(s, T + 15_700).spinning).toBe(false);
  });

  it('failed prices leave the header alone; a connected source failing colours it', () => {
    let s = fail(begin({}, ['prices/coingecko'], T, false), 'prices/coingecko', T + 100, '429', 'retry');
    expect(headerView(s, T + 200)).toMatchObject({ spinning: false, tone: 'idle' });
    expect(headerView(s, T + 200).title).not.toMatch(/CoinGecko/);

    s = fail(begin(s, ['binance/funding'], T, false), 'binance/funding', T + 300, 'timeout', 'retry');
    expect(headerView(s, T + 400)).toMatchObject({ spinning: true, tone: 'warn' });
    expect(headerView(s, T + 400).title).toMatch(/Binance · Funding failed: timeout · retrying in 15 s/);

    s = fail(begin(s, ['okx/spot'], T, false), 'okx/spot', T + 500, 'Invalid OK-ACCESS-KEY', 'fatal');
    expect(headerView(s, T + 600).tone).toBe('error');

    // a part not offered for the account is noted on its source, not in the header
    s = fail(begin(s, ['binance/futuresCoinM'], T, false), 'binance/futuresCoinM', T + 700, 'No permission', 'unavailable');
    expect(headerView(s, T + 800).title).not.toMatch(/Not available/);
    expect(sourceView(s, 'binance', T + 800).title).toMatch(/Not available: COIN-M futures/);
  });

  it('"updated" says when the source last loaded, and which part lags behind', () => {
    let s = succeed(begin({}, ['binance/spot', 'binance/savingsFixed'], T, false), 'binance/savingsFixed', T);
    s = succeed(s, 'binance/spot', T + 4 * 60_000);
    expect(sourceView(s, 'binance', T + 4 * 60_000 + 2_000).title)
      .toMatch(/Updated just now · Locked Simple Earn 4 min ago/);
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
