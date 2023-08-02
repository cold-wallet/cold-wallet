export default class MonobankCurrencyResponse {
    constructor(
        public currencyCodeA: number, // 840,
        public currencyCodeB: number, // 980,
        public date: number, // 1690837273,
        public rateBuy: number, // 36.65,
        public rateCross: number, // 0,
        public rateSell: number, // 37.4406
    ) {
    }
}
