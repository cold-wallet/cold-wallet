import PriceService from './PriceService';
import MonobankCurrencyResponse from '../integrations/monobank/MonobankCurrencyResponse';

const rate = (a: number, b: number, cross: number) => ({ currencyCodeA: a, currencyCodeB: b, rateCross: cross, rateBuy: cross, rateSell: cross } as MonobankCurrencyResponse);
// one consistent market: EUR = 50 UAH, USD = 40 UAH (1 EUR = 1.25 USD); BTC = 50 000 EUR = 62 500 USD;
// ETH = 0.04 BTC = 2 000 EUR = 2 500 USD; 1 USDT = 1 USD
const fx = [rate(978, 980, 50), rate(840, 980, 40)];
const binanceFull = { BTCEUR: '50000', ETHBTC: '0.04', BTCUSDT: '62500', ETHUSDT: '2500' };
const okxFull = { 'BTC-USDT': '62500', 'ETH-USDT': '2500', 'ETH-BTC': '0.04' };
const geckoFull = {
    btc: { usd: 62_500, eur: 50_000, uah: 2_500_000, btc: 1 },
    eth: { usd: 2_500, eur: 2_000, uah: 100_000, btc: 0.04 },
    usdt: { usd: 1, eur: 0.8, uah: 40 },
};

const usd = (ps: PriceService, coin: string, amount = 1) => ps.transform(coin, amount, 'USD');
const priced = (v: number) => isFinite(v) && v > 0;

describe('PriceService crypto → USD', () => {
    it('prices crypto from USDT pairs before Monobank rates arrive', () => {
        const ps = new PriceService({ BTCUSDT: '62500', ETHUSDT: '2500' }, [], {}, {});
        expect(usd(ps, 'BTC', 2)).toBeCloseTo(125_000);
        expect(usd(ps, 'ETH')).toBeCloseTo(2_500);
    });

    it('prices crypto from OKX or CoinGecko alone, without Monobank', () => {
        expect(usd(new PriceService({}, [], { 'BTC-USDT': '62500' }, {}), 'BTC')).toBeCloseTo(62_500);
        expect(usd(new PriceService({}, [], {}, { eth: { usd: 2_500 } }), 'ETH')).toBeCloseTo(2_500);
    });

    it('turns USDT quotes into USD with CoinGecko\'s USDT price when it has one, else 1:1', () => {
        const binance = { BTCUSDT: '62500' };
        expect(usd(new PriceService(binance, [], {}, {}), 'USDT', 10)).toBeCloseTo(10);
        const offPeg = new PriceService(binance, [], {}, { usdt: { usd: 0.99 } });
        expect(usd(offPeg, 'USDT', 10)).toBeCloseTo(9.9);
        expect(usd(offPeg, 'BTC')).toBeCloseTo(62_500 * 0.99);
    });

    it('agrees with the BTC → EUR → Monobank route when every source is there', () => {
        const direct = new PriceService(binanceFull, fx, okxFull, geckoFull);
        // the same market without any USD/USDT quote can only use the old route
        const viaEur = new PriceService({ BTCEUR: '50000', ETHBTC: '0.04' }, fx, { 'ETH-BTC': '0.04' }, {});
        for (const coin of ['BTC', 'ETH']) {
            expect(usd(direct, coin, 3)).toBeCloseTo(usd(viaEur, coin, 3), 6);
        }
        expect(usd(direct, 'BTC')).toBeCloseTo(62_500);
        expect(usd(direct, 'ETH')).toBeCloseTo(2_500);
    });

    it('falls back to the BTC → EUR → Monobank route when no USD/USDT quote exists', () => {
        const ps = new PriceService({ BTCEUR: '50000', ETHBTC: '0.04' }, fx, {}, {});
        expect(usd(ps, 'ETH')).toBeCloseTo(2_500);
    });

    it('leaves a coin no source knows unpriced', () => {
        for (const ps of [
            new PriceService(binanceFull, fx, okxFull, geckoFull),
            new PriceService(binanceFull, [], okxFull, geckoFull),
            new PriceService({}, [], {}, {}),
        ]) {
            expect(priced(usd(ps, 'NOPE'))).toBe(false);
        }
    });

    it('ignores zero or garbage quotes instead of pricing at them', () => {
        const ps = new PriceService({ BTCUSDT: '0', ETHUSDT: 'oops' }, [], { 'BTC-USDT': '' }, { btc: { usd: 0 } });
        expect(priced(usd(ps, 'BTC'))).toBe(false);
        expect(priced(usd(ps, 'ETH'))).toBe(false);
    });

    it('keeps fiat → fiat on Monobank rates', () => {
        const ps = new PriceService(binanceFull, fx, okxFull, geckoFull);
        expect(ps.transform('EUR', 10, 'USD')).toBeCloseTo(12.5);
        expect(priced(new PriceService(binanceFull, [], okxFull, geckoFull).transform('EUR', 10, 'USD'))).toBe(false);
    });
});
