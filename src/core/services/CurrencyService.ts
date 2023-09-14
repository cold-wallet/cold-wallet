import BinanceCurrencyResponse from "../integrations/binance/BinanceCurrencyResponse";
import FiatCurrency from "../fiatCurrencies/FiatCurrency";
import OkxCurrencyResponse from "../integrations/okx/OkxCurrencyResponse";
import CoinGeckoCurrencyResponse from "../integrations/coingecko/CoinGeckoCurrencyResponse";

export class CurrencyService {
    constructor(
        public binanceCurrencies: { [index: string]: BinanceCurrencyResponse },
        public monobankCurrencies: { [index: string]: FiatCurrency },
        public okxCurrencies: { [index: string]: OkxCurrencyResponse },
        public coingeckoCurrencies: { [index: string]: CoinGeckoCurrencyResponse },
    ) {
    }

    getCurrencyList() {
        return new Set<string>(new Array<string>()
            .concat(Object.keys(this.binanceCurrencies))
            .concat(Object.keys(this.monobankCurrencies))
            .concat(Object.keys(this.okxCurrencies))
            .concat(Object.keys(this.coingeckoCurrencies))
        )
    }

}
