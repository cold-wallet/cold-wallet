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
  it('counts what a group sum leaves out and whether a price may still come', () => {
    const noFx = new PriceService({ BTCEUR: '50000' }, [], {}, {});
    const [g] = sidebarGroups(valueAssets([asset('USD', '5', AssetType.fiat), asset('EUR', '1', AssetType.fiat)], noFx, false, () => true), '');
    expect([g.sum, g.unpriced, g.pending]).toEqual([5, 1, true]);
    const [none] = sidebarGroups(valueAssets([asset('EUR', '1', AssetType.fiat)], noFx, false, () => false), '');
    expect([none.unpriced, none.pending]).toEqual([1, false]);
  });
});

describe('valueAssets: prices on the way', () => {
  const noFx = new PriceService({}, [], {}, {});
  const mm = (code: string) => Object.assign(asset(code, '3', AssetType.crypto), { isMetaMaskAsset: true });

  it('marks a holding without a price as pending while one may still arrive', () => {
    const [h] = valueAssets([asset('EUR', '1', AssetType.fiat)], noFx, false, () => true);
    expect([h.priced, h.pending]).toEqual([false, true]);
  });

  it('keeps a MetaMask token whose price is loading, and hides one no source prices', () => {
    const loading = valueAssets([mm('REAL')], noFx, true, () => true);
    expect(loading.map((h) => h.code)).toEqual(['REAL']);
    expect(valueAssets([mm('SCAM')], noFx, true, () => false)).toEqual([]);
  });
});
