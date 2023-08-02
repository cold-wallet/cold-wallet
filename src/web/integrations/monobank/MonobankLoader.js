import {useEffect, useState} from "react";
import useInterval from "../../../core/utils/useInterval";
import monobankApiClient from "../../../core/integrations/monobank/monobankApiClient.ts";

const MonobankLoader = () => {

    const [monobankRates, setMonobankRates] = useState(JSON.parse(localStorage.getItem('monobankRates')));
    const [monobankCurrencies, setMonobankCurrencies] = useState(JSON.parse(localStorage.getItem('monobankCurrencies')));
    let loadMonobank = () => {
        monobankApiClient.fetchMonobankRatesAndCurrencies().then(response => {
            if (response.success) {
                setMonobankRates(response.result.rates);
                setMonobankCurrencies(response.result.currencies);
            } else {
                console.warn('Error fetching rates from monobank:', response.error);
            }
        });
    };
    useEffect(loadMonobank, []);
    useInterval(loadMonobank, 60000);
    useEffect(() => {
        monobankRates && localStorage.setItem('monobankRates', JSON.stringify(monobankRates));
    }, [monobankRates]);
    useEffect(() => {
        monobankCurrencies && localStorage.setItem('monobankCurrencies', JSON.stringify(monobankCurrencies));
    }, [monobankCurrencies]);

    return {
        monobankRates,
        monobankCurrencies,
    }
}

export default MonobankLoader;
