import {useState} from "react";
import useInterval from "../utils/useInterval";
import FiatCurrency from "../fiatCurrencies/FiatCurrency";
import MonobankCurrencyResponse from "../integrations/monobank/MonobankCurrencyResponse";

export default function OnStartupLoader(
    binancePricesLoaded: boolean,
    binanceCurrenciesLoaded: boolean,
    okxPricesLoaded: boolean,
    okxCurrenciesLoaded: boolean,
    coinGeckoPricesLoaded: boolean,
    coinGeckoCurrenciesLoaded: boolean,
    monobankRates: MonobankCurrencyResponse[] | null,
    monobankCurrencies: { [index: string]: FiatCurrency } | null,
) {

    const [loaded, setLoaded] = useState(false);
    useInterval(() => {
        if (!loaded && binancePricesLoaded && binanceCurrenciesLoaded
            && okxPricesLoaded && okxCurrenciesLoaded
            && !!monobankRates && !!monobankCurrencies
        ) {
            setLoaded(true)
        }
    }, loaded ? null : 500);

    return {
        loaded
    }
}
