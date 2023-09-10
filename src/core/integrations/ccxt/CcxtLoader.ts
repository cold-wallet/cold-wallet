import StorageFactory from "../../domain/StorageFactory";
import binanceApiClient, {AccountInfo} from "../binance/binanceApiClient";
import {Dispatch, SetStateAction, useEffect} from "react";
import useInterval from "../../utils/useInterval";
import UserData from "../../domain/UserData";
import ccxtConnector from "./ccxtConnector";

interface CcxtAccountBalance {
    currency: string,
    available: number,
    platformType?: string,
}

interface CcxtAccountData {
    exchangeName: string,
    balances: CcxtAccountBalance[],
}

interface CcxtAccountsData {
    [exchangeName: string]: CcxtAccountData,
}

export default function CcxtLoader(
    loadingUserDataAllowed: boolean,
    storageFactory: StorageFactory,
    userData: UserData,
    setUserData: Dispatch<SetStateAction<UserData>>,
) {

    const enabledCcxtIntegrations = new Set(Object.entries(userData.settings.integrations || {})
        .filter(entry => entry[1].enabled)
        .map(entry => entry[0]))

    function getInitialUserData() {
        return Array.from(enabledCcxtIntegrations)
            .reduce((result, exchange) => {
                if (userData.settings.integrations && userData.settings.integrations[exchange]) {
                    result[exchange] = await ccxtConnector.loadUserData(exchange,
                        userData.settings.integrations[exchange].apiKey,
                        userData.settings.integrations[exchange].apiSecret,
                        userData.settings.integrations[exchange].password,
                        userData.settings.integrations[exchange].additionalSetting,
                    )
                }
                return result
            }, {} as { [p: string]: any });
    }

    const [
        ccxtUserData,
        setCcxtUserData
    ] = storageFactory.createStorageNullable<CcxtAccountsData>("ccxtUserData");

    const loadCcxtUserData = () => {
        Array.from(enabledCcxtIntegrations)
            .reduce((result, exchange) => {
                if (userData.settings.integrations && userData.settings.integrations[exchange]) {
                    result[exchange] = await ccxtConnector.loadUserData(exchange,
                        userData.settings.integrations[exchange].apiKey,
                        userData.settings.integrations[exchange].apiSecret,
                        userData.settings.integrations[exchange].password,
                        userData.settings.integrations[exchange].additionalSetting,
                    )
                }
                return result
            }, {} as { [p: string]: any });
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
    useEffect(loadCcxtUserData, []);
    useInterval(loadCcxtUserData, 60_000);

    return {
        ccxtUserData, setCcxtUserData,
        enabledCcxtIntegrations,
    }
}
