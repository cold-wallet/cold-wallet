import MonobankCurrencyResponse from "./MonobankCurrencyResponse";

export default class MonobankPublicDataResponse {
    constructor(
        public rates: MonobankCurrencyResponse[],
        public currencies: {},
    ) {
    }
}
