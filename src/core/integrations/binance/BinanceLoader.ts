import {useEffect, useRef, useState} from "react";
import binanceApiClient, {AccountInfo, BinanceSection, CORE_SECTIONS, HEAVY_SECTIONS, SpotAccount} from "../../../core/integrations/binance/binanceApiClient";
import useInterval from "../../../core/utils/useInterval";
import ApiResponse from "../../../core/domain/ApiResponse";
import StorageFactory from "../../domain/StorageFactory";
import BinanceCurrencyResponse from "./BinanceCurrencyResponse";
import {createDemoBinanceAssets} from "../../utils/DemoAssetsGenerator";

// Heavy (staking / simple-earn) sections change slowly and 429 the most — refresh them at most
// this often, while core balances refresh every 60s tick. Cuts heavy-endpoint proxy load ~5x.
const HEAVY_INTERVAL_MS = 5 * 60_000;

const BinanceLoader = (
    isDemoMode: boolean,
    loadingUserDataAllowed: boolean,
    storageFactory: StorageFactory,
    // Store for binanceUserData — in-memory during a demo session so injected demo assets
    // never persist. Prices/currencies stay on the (always-localStorage) storageFactory.
    userDataStorageFactory: StorageFactory,
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
    ] = userDataStorageFactory.createStorageNullable<AccountInfo>("binanceUserData");

    const loadingRef = useRef(false); // skip a tick while the previous cycle is still running
    const lastHeavyAt = useRef(0);    // last time heavy (staking/simple-earn) sections were refreshed
    let loadBinanceUserData = () => {
        if (isDemoMode) {
            setBinanceUserData(new AccountInfo({
                accountType: "SPOT",
                balances: createDemoBinanceAssets()
            } as SpotAccount));
            return;
        }
        if (!binanceIntegrationEnabled
            || !binanceIntegrationApiKey
            || !binanceIntegrationApiSecret
            || !binanceCurrencies
            || !loadingUserDataAllowed
            || loadingRef.current
        ) {
            return
        }
        // Core balances every tick; heavy sections only once per HEAVY_INTERVAL_MS (and on the
        // first load, when lastHeavyAt is 0, so the initial view is complete).
        const due = new Set<BinanceSection>(CORE_SECTIONS);
        if (Date.now() - lastHeavyAt.current >= HEAVY_INTERVAL_MS) {
            HEAVY_SECTIONS.forEach(s => due.add(s));
            lastHeavyAt.current = Date.now();
        }
        loadingRef.current = true;
        binanceApiClient.getUserInfoAsync(
            binanceIntegrationApiKey,
            binanceIntegrationApiSecret,
            binanceCurrencies,
            binanceUserData,
            due,
        )
            .then((accountInfo: AccountInfo) => {
                if (accountInfo.account?.balances) {
                    setBinanceUserData(accountInfo);
                } else {
                    console.warn('Error fetching account data from binance:', accountInfo);
                }
            })
            .catch((e) => console.warn('Error fetching account data from binance:', e))
            .finally(() => { loadingRef.current = false; });
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
