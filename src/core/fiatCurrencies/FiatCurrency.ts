export default class FiatCurrency {
    constructor(
        public code: string, // "ZMK",
        public numCode: string, // "894",
        public afterDecimalPoint: number, // 2,
        public name: string, // "Zambian Kwacha"
    ) {
    }
}
