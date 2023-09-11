import StorageFactory from "../../domain/StorageFactory";
import {useEffect, useState} from "react";
import useInterval from "../../utils/useInterval";
import UserData from "../../domain/UserData";
import ccxtConnector from "./ccxtConnector";
import {Balances} from "ccxt/js/src/base/types";

export interface CcxtAccountsData {
    [exchangeName: string]: Balances,
}

export default function CcxtLoader(
    loadingUserDataAllowed: boolean,
    storageFactory: StorageFactory,
    userData: UserData,
) {
    const getEnabledCcxtIntegrations = () => new Set(Object.entries(userData.settings.integrations || {})
        .filter(([, integration]) => integration.enabled)
        .map(([name]) => name))

    const [enabledCcxtIntegrations, setEnabledCcxtIntegrations]
        = useState<Set<string>>(getEnabledCcxtIntegrations);

    const [
        ccxtUserData,
        setCcxtUserData
    ] = storageFactory.createStorage<CcxtAccountsData>("ccxtUserData", () => ({} as CcxtAccountsData));

    const loadCcxtUserData = () => {
        if (!loadingUserDataAllowed) {
            return
        }
        const ccxtAccountsData = Array.from(enabledCcxtIntegrations)
            .reduce((result, exchange) => {
                if (userData.settings.integrations && userData.settings.integrations[exchange]) {
                    ccxtConnector
                        .loadUserData(exchange,
                            userData.settings.integrations[exchange].apiKey,
                            userData.settings.integrations[exchange].apiSecret,
                            userData.settings.integrations[exchange].password,
                            userData.settings.integrations[exchange].additionalSetting,)
                        .then(response => {
                            if (response.success) {
                                console.log(`successfully loaded ${exchange} account data`, response.result)
                                result[exchange] = response.result
                            } else {
                                console.error(`failed to load exchange ${exchange} data`, response)
                            }
                        })
                }
                return result
            }, {} as CcxtAccountsData);
        const newCcxtAccountsData = {
            ...ccxtUserData,
            ...ccxtAccountsData,
        }
        setCcxtUserData(newCcxtAccountsData);
    };
    useEffect(loadCcxtUserData, [loadingUserDataAllowed]);
    useInterval(loadCcxtUserData, 60_000);

    return {
        ccxtUserData, setCcxtUserData,
        enabledCcxtIntegrations,
        setEnabledCcxtIntegrations,
        getEnabledCcxtIntegrations,
    }
}
