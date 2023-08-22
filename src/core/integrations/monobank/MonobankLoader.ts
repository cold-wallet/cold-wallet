import {useEffect} from "react";
import useInterval from "../../../core/utils/useInterval";
import monobankApiClient from "../../../core/integrations/monobank/monobankApiClient";
import ApiResponse from "../../../core/domain/ApiResponse";
import MonobankPublicDataResponse from "../../../core/integrations/monobank/MonobankPublicDataResponse";
import FiatCurrency from "../../../core/fiatCurrencies/FiatCurrency";
import MonobankCurrencyResponse from "../../../core/integrations/monobank/MonobankCurrencyResponse";
import StorageFactory from "../../domain/StorageFactory";
import MonobankUserDataStorage from "./MonobankUserDataStorage";
import MonobankUserData from "./MonobankUserData";

const MonobankLoader = (
    storageFactory: StorageFactory,
    monobankIntegrationEnabled: boolean,
    monobankIntegrationToken: string | null
) => {

    const [
        monobankRates,
        setMonobankRates
    ] = storageFactory.createStorageNullable<MonobankCurrencyResponse[]>("monobankRates");

    const [
        monobankCurrencies,
        setMonobankCurrencies
    ] = storageFactory.createStorageNullable<{ [index: string]: FiatCurrency }>("monobankCurrencies");

    const loadMonobank = () => {
        monobankApiClient.fetchMonobankRatesAndCurrencies()
            .then((response: ApiResponse<MonobankPublicDataResponse | any>) => {
                if (response.success && response.result) {
                    const result: MonobankPublicDataResponse = response.result;
                    setMonobankRates(result.rates);
                    setMonobankCurrencies(result.currencies);
                } else {
                    console.warn('Error fetching rates from monobank:', response.error);
                }
            });
    };
    useEffect(loadMonobank, []);
    useInterval(loadMonobank, 60000);

    const [
        monobankUserData,
        setMonobankUserData
    ] = MonobankUserDataStorage(storageFactory)

    const loadMonobankUserData = () => {
        if (!monobankIntegrationEnabled || !monobankIntegrationToken) {
            return
        }
        monobankApiClient.getUserInfo(monobankIntegrationToken)
            .then((response: ApiResponse<MonobankUserData | any>) => {
                if (response.success && response.result) {
                    setMonobankUserData(response.result);
                } else {
                    console.warn('Error fetching user data from monobank:', response.error);
                }
            });
    };
    useEffect(loadMonobankUserData, []);
    useInterval(loadMonobankUserData, 60000 * 5);

    return {
        monobankRates,
        monobankCurrencies,
        monobankUserData,
        setMonobankUserData,
        loadMonobankUserData,
    }
}

export default MonobankLoader;
