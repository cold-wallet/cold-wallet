import FiatCurrency from "./FiatCurrency";
import currenciesIsoJson from "./../../resources/currencies-iso-4217.json";
import currencyCodesJson from "./../../resources/currencies-iso-4217-code.json";

// A few entries (precious metals: XAG, XAU, ...) carry afterDecimalPoint: null in the
// source data, so the JSON isn't structurally a FiatCurrency map. Consumers already
// tolerate this at runtime (e.g. `?.afterDecimalPoint || 8`); the assertion preserves
// the previous require()-based behavior where these were typed as `any`.
const currenciesIso = currenciesIsoJson as unknown as Record<string, FiatCurrency>;
const currencyCodes = currencyCodesJson as unknown as Record<string, FiatCurrency>;

const fiatCurrencies = {
    getByStringCode(code: string): FiatCurrency | undefined {
        return currenciesIso[code]
    },
    getByNumCode(code: number | string): FiatCurrency | undefined {
        const currencyCodeLength = 3;
        let strCode = "" + code;
        let addZeros = currencyCodeLength - strCode.length;

        while (addZeros > 0) {
            strCode = "0" + strCode;
            --addZeros
        }
        let res = currencyCodes[strCode];
        if (!res) {
            console.warn("can't find currency data for code", strCode)
        }
        return res
    },
};

export default fiatCurrencies;
