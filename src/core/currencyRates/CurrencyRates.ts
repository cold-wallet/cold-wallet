import fiatCurrencies from "../fiatCurrencies";
import MonobankCurrencyResponse from "../integrations/monobank/MonobankCurrencyResponse";

const uahNumCode = 980;
const eurNumCode = 978;
const BTC = "BTC";
const EUR = "EUR";
const USDT = "USDT";


function isFiat(currency: string) {
    return !!fiatCurrencies.getByStringCode(currency)
}

export default class CurrencyRates {
    constructor(
        private binancePrices: { [index: string]: string },
        private monobankRates: MonobankCurrencyResponse[],
        private okxPrices: { [index: string]: string },
    ) {
    }

    transform(currencyFrom: string, amount: number, currencyTo: string): number {
        const fromFiat = isFiat(currencyFrom);
        const toFiat = isFiat(currencyTo);

        if (fromFiat) {
            return toFiat
                ? this.transformFiatToFiat(currencyFrom, amount, currencyTo)
                : this.transformFiatToCrypto(currencyFrom, amount, currencyTo)
        } else {
            return toFiat
                ? this.transformCryptoToFiat(currencyFrom, amount, currencyTo)
                : this.transformCryptoToCrypto(currencyFrom, amount, currencyTo)
        }
    }

    private findFiatRate(left: number, right: number) {
        const rate = this.monobankRates.filter(r => (r.currencyCodeA === left)
            && (r.currencyCodeB === right))[0];

        return (rate.rateCross || rate.rateBuy)// ((rate.rateBuy + rate.rateSell) / 2));
    }

    private findFiatRateToEUR(currencyNumCode: number) {
        if (currencyNumCode === eurNumCode) {
            return 1
        }
        let currencyToUAH = (currencyNumCode === uahNumCode) ? 1
            : this.findFiatRate(currencyNumCode, uahNumCode);
        let eurToUAH = this.findFiatRate(eurNumCode, uahNumCode);
        return currencyToUAH / eurToUAH;
    }

    private transformFiatToFiat(currencyFrom: string, amount: number, currencyTo: string): number {
        const outputCurrencyNumCode = +(fiatCurrencies.getByStringCode(currencyTo)?.numCode || 0);
        const currencyNumCode = +(fiatCurrencies.getByStringCode(currencyFrom)?.numCode || 0);

        if (currencyNumCode === outputCurrencyNumCode) {
            return amount
        }
        const amountInEUR = (currencyNumCode === eurNumCode) ? amount : (isFiat(currencyFrom)
            ? (amount * this.findFiatRateToEUR(currencyNumCode))
            : this.transformCryptoToCrypto(currencyFrom, amount, EUR))

        if (outputCurrencyNumCode === eurNumCode) {
            return amountInEUR
        }
        const rateCross = this.findFiatRateToEUR(outputCurrencyNumCode);
        return amountInEUR / rateCross;
    }

    private getCryptoPrice(left: string, right: string) {
        let price = +(this.binancePrices[`${left}${right}`]);
        if (price && !isNaN(price)) {
            return price;
        }
        price = +(this.binancePrices[`${right}${left}`]);

        if (price && !isNaN(price)) {
            return 1 / price;
        }
        const price1 = +(this.binancePrices[`${left}${USDT}`]);
        const price2 = +(this.binancePrices[`${right}${USDT}`]);
        price = price1 / price2;
        if (isNaN(price)) {
            price = this.getCryptoPriceOKX(left, right)
        }
        return price;
    }

    private getCryptoPriceOKX(left: string, right: string) {
        let price = +(this.okxPrices[`${left}-${right}`]);
        if (price && !isNaN(price)) {
            return price;
        }
        price = +(this.okxPrices[`${right}-${left}`]);

        if (price && !isNaN(price)) {
            return 1 / price;
        }
        const price1 = +(this.okxPrices[`${left}-${USDT}`]);
        const price2 = +(this.okxPrices[`${right}-${USDT}`]);
        price = price1 / price2;
        return price;
    }

    private transformFiatToCrypto(currencyFrom: string, amount: number, currencyTo: string): number {
        if (currencyFrom === currencyTo) {
            return amount
        }
        const eurAmount = (currencyFrom === EUR) ? amount
            : this.transformFiatToFiat(currencyFrom, amount, EUR);

        const btcEurPrice = this.getCryptoPrice(BTC, EUR);
        const btcAmount = eurAmount / btcEurPrice;

        if (currencyTo === BTC) {
            return btcAmount
        }
        return this.transformCrypto(btcAmount, BTC, currencyTo);
    }

    private transformCrypto(amountFrom: number, currencyFrom: string, currencyTo: string) {
        let price = this.getCryptoPrice(currencyFrom, currencyTo);
        if (price) {
            return amountFrom * price;
        }
        price = this.getCryptoPrice(currencyTo, currencyFrom);
        return amountFrom / price;
    }

    private transformCryptoToFiat(currencyFrom: string, amount: number, currencyTo: string): number {
        const btcAmount = (currencyFrom === BTC)
            ? amount
            : this.transformCrypto(amount, currencyFrom, BTC);

        const btcEurPrice = this.getCryptoPrice(BTC, EUR);
        const amountInEur = btcAmount * btcEurPrice;

        if (currencyFrom === BTC && currencyTo === EUR) {
            return amountInEur;
        }
        return this.transformFiatToFiat(EUR, amountInEur, currencyTo);
    }

    private transformCryptoToCrypto(currencyFrom: string, amount: number, currencyTo: string): number {
        if (currencyFrom === currencyTo) {
            return amount
        }
        let resultAmount = this.transformCrypto(amount, currencyFrom, currencyTo);
        if (resultAmount) {
            return resultAmount
        }
        let btcAmount = this.transformCrypto(amount, currencyFrom, BTC);
        return this.transformCrypto(btcAmount, BTC, currencyTo);
    }
}
