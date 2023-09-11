import StorageFactory from "../../domain/StorageFactory";
import {useEffect, useState} from "react";
import useInterval from "../../utils/useInterval";
import UserData from "../../domain/UserData";
import ccxtConnector from "./ccxtConnector";
import AssetDTO from "../../domain/AssetDTO";

export interface CcxtAccountsData {
    [exchangeName: string]: AssetDTO[],
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
        Promise.all(Array.from(enabledCcxtIntegrations)
            .filter(exchange => userData.settings.integrations && userData.settings.integrations[exchange])
            .map(exchange => ccxtConnector.loadUserData(
                exchange,
                userData.settings.integrations[exchange].apiKey,
                userData.settings.integrations[exchange].apiSecret,
                userData.settings.integrations[exchange].password,
                userData.settings.integrations[exchange].additionalSetting,
            )))
            .then(responses => responses
                .reduce((result, response) => {
                    if (response.result?.length) {
                        const exchangeName = response.result
                            .reduce((result, asset) => asset.ccxtExchangeName || result, "ccxt")
                        result[exchangeName] = response.result
                    }
                    return result
                }, {} as CcxtAccountsData)
            )
            .then(ccxtAccountsData => {
                const newCcxtAccountsData = {
                    ...ccxtUserData,
                    ...ccxtAccountsData,
                }
                const disabledExchanges = Object.keys(ccxtUserData)
                    .filter(exchangeName => !enabledCcxtIntegrations.has(exchangeName))

                disabledExchanges.forEach(disabledExchange => delete newCcxtAccountsData[disabledExchange])

                setCcxtUserData(newCcxtAccountsData);
            })
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
