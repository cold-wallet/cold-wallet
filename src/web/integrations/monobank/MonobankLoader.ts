import {useEffect, useState} from "react";
import useInterval from "../../../core/utils/useInterval";
import monobankApiClient from "../../../core/integrations/monobank/monobankApiClient";
import ApiResponse from "../../../core/domain/ApiResponse";
import MonobankPublicDataResponse from "../../../core/integrations/monobank/MonobankPublicDataResponse";
import MonobankCurrencyResponse from "../../../core/integrations/monobank/MonobankCurrencyResponse";
import FiatCurrency from "../../../core/fiatCurrencies/FiatCurrency";

const ratesKey = 'monobankRates';
const currenciesKey = 'monobankCurrencies';

const MonobankLoader = () => {

    let ratesStored = localStorage.getItem(ratesKey);
    let ratesInitialState: MonobankCurrencyResponse[] | null = ratesStored ? JSON.parse(ratesStored) : null;
    const [monobankRates, setMonobankRates] = useState(ratesInitialState);
    let currenciesStored = localStorage.getItem(currenciesKey);
    let currenciesInitialState: { [index: string]: FiatCurrency } | null = currenciesStored ? JSON.parse(currenciesStored) : null;
    const [monobankCurrencies, setMonobankCurrencies] = useState(currenciesInitialState);
    let loadMonobank = () => {
        monobankApiClient.fetchMonobankRatesAndCurrencies()
            .then((response: ApiResponse<MonobankPublicDataResponse | any>) => {
                if (response.success && response.result) {
                    let result: MonobankPublicDataResponse = response.result;
                    setMonobankRates(result.rates);
                    setMonobankCurrencies(result.currencies);
                } else {
                    console.warn('Error fetching rates from monobank:', response.error);
                }
            });
    };
    useEffect(loadMonobank, []);
    useInterval(loadMonobank, 60000);
    useEffect(() => {
        monobankRates && localStorage.setItem(ratesKey, JSON.stringify(monobankRates));
    }, [monobankRates]);
    useEffect(() => {
        let stringify = JSON.stringify(monobankCurrencies);
        monobankCurrencies && localStorage.setItem(currenciesKey, stringify);
    }, [monobankCurrencies]);

    return {
        monobankRates,
        monobankCurrencies,
    }
}

export default MonobankLoader;
