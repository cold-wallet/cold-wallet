import {useEffect, useState} from "react";
import binanceApiClient, {AccountInfo} from "../../../core/integrations/binance/binanceApiClient";
import useInterval from "../../../core/utils/useInterval";
import ApiResponse from "../../../core/domain/ApiResponse";
import StorageFactory from "../../domain/StorageFactory";
import BinanceCurrencyResponse from "./BinanceCurrencyResponse";

const BinanceLoader = (
    loadingUserDataAllowed: boolean,
    storageFactory: StorageFactory,
    binanceIntegrationEnabled: boolean,
    binanceIntegrationApiKey: string | null,
    binanceIntegrationApiSecret: string | null,
) => {
    const [
        binancePrices,
        setBinancePrices
    ] = storageFactory.createStorageNullable<{ [p: string]: string }>("binancePrices");

    const [binancePricesLoaded, setBinancePricesLoaded] = useState(false);
    let loadBinancePrices = () => {
        binanceApiClient.fetchBinancePrices().then((response: ApiResponse<{ [p: string]: string } | any>) => {
            if (response.success) {
                setBinancePrices(response.result);
                setBinancePricesLoaded(true);
            } else {
                console.warn('Error fetching prices from binance:', response);
            }
        })
    };
    useEffect(loadBinancePrices, []);
    useInterval(loadBinancePrices, 15_000);

    const [
        binanceCurrencies,
        setBinanceCurrencies
    ] = storageFactory.createStorageNullable<{ [index: string]: BinanceCurrencyResponse }>("binanceCurrencies");

    const [binanceCurrenciesLoaded, setBinanceCurrenciesLoaded] = useState(false);
    let loadBinanceCurrencies = () => {
        binanceApiClient.fetchBinanceCurrencies()
            .then((response: ApiResponse<{ [index: string]: BinanceCurrencyResponse } | any>) => {
                if (response.success) {
                    setBinanceCurrencies(response.result);
                    setBinanceCurrenciesLoaded(true);
                } else {
                    console.warn('Error fetching currencies from binance:', response.error);
                }
            });
    };
    useEffect(loadBinanceCurrencies, []);

    const [
        binanceUserData,
        setBinanceUserData
    ] = storageFactory.createStorageNullable<AccountInfo>("binanceUserData");

    let loadBinanceUserData = () => {
        if (!binanceIntegrationEnabled
            || !binanceIntegrationApiKey
            || !binanceIntegrationApiSecret
            || !binanceCurrencies
            || !loadingUserDataAllowed
        ) {
            return
        }
        binanceApiClient.getUserInfoAsync(
            binanceIntegrationApiKey,
            binanceIntegrationApiSecret,
            binanceCurrencies,
            binanceUserData
        )
            .then((accountInfo: AccountInfo) => {
                if (accountInfo.account?.balances) {
                    setBinanceUserData(accountInfo);
                } else {
                    console.warn('Error fetching account data from binance:', accountInfo);
                }
            });
    };
    useEffect(loadBinanceUserData, []);
    useInterval(loadBinanceUserData, 60_000);

    return {
        binancePrices, binancePricesLoaded,
        binanceCurrencies, binanceCurrenciesLoaded,
        binanceUserData, setBinanceUserData,
        loadBinanceUserData,
    }
}

export default BinanceLoader;
