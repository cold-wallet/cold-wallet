import {useEffect} from "react";
import useInterval from "../../../core/utils/useInterval";
import monobankApiClient from "../../../core/integrations/monobank/monobankApiClient";
import ApiResponse from "../../../core/domain/ApiResponse";
import MonobankPublicDataResponse from "../../../core/integrations/monobank/MonobankPublicDataResponse";
import FiatCurrency from "../../../core/fiatCurrencies/FiatCurrency";
import MonobankCurrencyResponse from "../../../core/integrations/monobank/MonobankCurrencyResponse";
import StorageFactory from "../../domain/StorageFactory";

const MonobankLoader = (storageFactory: StorageFactory) => {

    const [
        monobankRates,
        setMonobankRates
    ] = storageFactory.createStorageNullable<MonobankCurrencyResponse[]>("monobankRates");

    const [
        monobankCurrencies,
        setMonobankCurrencies
    ] = storageFactory.createStorageNullable<{ [index: string]: FiatCurrency }>("monobankCurrencies");

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

    return {
        monobankRates,
        monobankCurrencies,
    }
}

export default MonobankLoader;
