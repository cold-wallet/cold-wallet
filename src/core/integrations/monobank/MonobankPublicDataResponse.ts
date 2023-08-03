import MonobankCurrencyResponse from "./MonobankCurrencyResponse";
import FiatCurrency from "../../fiatCurrencies/FiatCurrency";

export default class MonobankPublicDataResponse {
    constructor(
        public rates: MonobankCurrencyResponse[],
        public currencies: { [index: string]: FiatCurrency },
    ) {
    }
}
