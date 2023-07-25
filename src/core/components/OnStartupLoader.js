import {useState} from "react";
import useInterval from "../utils/useInterval";

export default function OnStartupLoader(
    binancePricesLoaded,
    binanceCurrenciesLoaded,
    monobankRates,
    monobankCurrencies,
) {

    const [loaded, setLoaded] = useState(false);
    useInterval(() => {
        if (!loaded && binancePricesLoaded && binanceCurrenciesLoaded
            && !!monobankRates && !!monobankCurrencies
        ) {
            setLoaded(true)
        }
    }, loaded ? null : 1000);

    return {
        loaded
    }
}
