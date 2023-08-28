import {useEffect, useState} from "react";
import okxApiClient, {OkxAccount} from "./okxApiClient";
import useInterval from "../../../core/utils/useInterval";
import ApiResponse from "../../../core/domain/ApiResponse";
import StorageFactory from "../../domain/StorageFactory";
import OkxCurrencyResponse from "./OkxCurrencyResponse";

const OkxLoader = (
    loadingUserDataAllowed: boolean,
    storageFactory: StorageFactory,
    okxIntegrationEnabled: boolean,
    okxIntegrationApiKey: string | null,
    okxIntegrationApiSecret: string | null,
    okxIntegrationPassPhrase: string | null,
    okxIntegrationSubAccountName: string | null,
) => {
    const [
        okxPrices,
        setOkxPrices
    ] = storageFactory.createStorageNullable<{ [p: string]: string }>("okxPrices");

    const [okxPricesLoaded, setOkxPricesLoaded] = useState(false);
    let loadOkxPrices = () => {
        okxApiClient.fetchPrices().then((response: ApiResponse<{ [p: string]: string } | any>) => {
            if (response.success) {
                setOkxPrices(response.result);
                setOkxPricesLoaded(true);
            } else {
                console.warn('Error fetching prices from okx:', response);
            }
        })
    };
    useEffect(loadOkxPrices, []);
    useInterval(loadOkxPrices, 5_000);

    const [
        okxCurrencies,
        setOkxCurrencies
    ] = storageFactory.createStorageNullable<{ [index: string]: OkxCurrencyResponse }>("okxCurrencies");

    const [okxCurrenciesLoaded, setOkxCurrenciesLoaded] = useState(false);
    let loadOkxCurrencies = () => {
        okxApiClient.fetchCurrencies()
            .then((response: ApiResponse<{ [index: string]: OkxCurrencyResponse } | any>) => {
                if (response.success) {
                    setOkxCurrencies(response.result);
                    setOkxCurrenciesLoaded(true);
                } else {
                    console.warn('Error fetching currencies from okx:', response.error);
                }
            });
    };
    useEffect(loadOkxCurrencies, []);

    const [
        okxUserData,
        setOkxUserData
    ] = storageFactory.createStorageNullable<OkxAccount>("okxUserData");

    let loadOkxUserData = () => {
        if (!okxIntegrationEnabled
            || !okxIntegrationApiKey
            || !okxIntegrationApiSecret
            || !okxIntegrationPassPhrase
            || !okxCurrencies
            || !loadingUserDataAllowed
        ) {
            return
        }
        okxApiClient.getUserInfo(
            okxIntegrationApiKey,
            okxIntegrationApiSecret,
            okxIntegrationPassPhrase,
            okxIntegrationSubAccountName,
            okxCurrencies,
            okxUserData
        )
            .then((accountInfo: OkxAccount) => {
                if (accountInfo.spotAccountBalances?.length || accountInfo.subAccountBalances?.length) {
                    setOkxUserData(accountInfo);
                } else {
                    console.warn('Error fetching account data from OKX:', accountInfo);
                }
            });
    };
    useEffect(loadOkxUserData, []);
    useInterval(loadOkxUserData, 60_000);

    return {
        okxPrices, okxPricesLoaded,
        okxCurrencies, okxCurrenciesLoaded,
        okxUserData, setOkxUserData,
        loadOkxUserData,
    }
}

export default OkxLoader;
