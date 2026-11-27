import AssetDTO, { AssetType } from '../domain/AssetDTO';
import PriceService from '../services/PriceService';
import MonobankCurrencyResponse from '../integrations/monobank/MonobankCurrencyResponse';
import { sidebarGroups, totalUsd, valueAssets } from './portfolio';

const asset = (currency: string, amount: string, type: AssetType) => new AssetDTO(currency, currency, amount, currency, 8, type);
const rate = (a: number, b: number, cross: number) => ({ currencyCodeA: a, currencyCodeB: b, rateCross: cross, rateBuy: cross, rateSell: cross } as MonobankCurrencyResponse);
// EUR = 50 UAH, USD = 40 UAH; BTC = 50 000 EUR
const fx = [rate(978, 980, 50), rate(840, 980, 40)];
const holdings = [asset('USD', '100', AssetType.fiat), asset('BTC', '1', AssetType.crypto), asset('EUR', '10', AssetType.fiat)];

describe('valueAssets without every price', () => {
  it('marks holdings it can price and counts only those', () => {
    const ps = new PriceService({ BTCEUR: '50000' }, fx, {}, {});
    const v = valueAssets(holdings, ps);
    expect(v.every((h) => h.priced)).toBe(true);
    expect(totalUsd(v)).toBeCloseTo(100 + 62_500 + 12.5);
  });

  it('leaves a holding without a price at 0 and says so, instead of a made-up value', () => {
    // FX rates not fetched yet: only USD itself is known
    const v = valueAssets(holdings, new PriceService({ BTCEUR: '50000' }, [], {}, {}));
    expect(v.map((h) => [h.code, h.priced, h.usd])).toEqual([['USD', true, 100], ['BTC', false, 0], ['EUR', false, 0]]);
    expect(totalUsd(v)).toBe(100);
  });

  it('does not price a coin no source knows', () => {
    const v = valueAssets([asset('NOPE', '5', AssetType.crypto)], new PriceService({ BTCEUR: '50000' }, fx, {}, {}));
    expect(v[0].priced).toBe(false);
    expect(v[0].usd).toBe(0);
  });
});

describe('sidebarGroups without prices', () => {
  it('says whether a group has anything priced, so its sum is not shown as $0', () => {
    const [manual] = sidebarGroups(valueAssets([asset('BTC', '1', AssetType.crypto)], new PriceService({ BTCEUR: '50000' }, [], {}, {})), '');
    expect(manual.priced).toBe(false);
    const [same] = sidebarGroups(valueAssets([asset('BTC', '1', AssetType.crypto)], new PriceService({ BTCEUR: '50000' }, fx, {}, {})), '');
    expect(same.priced).toBe(true);
  });
});
