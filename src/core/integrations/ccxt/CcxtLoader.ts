import StorageFactory from "../../domain/StorageFactory";
import {useEffect, useRef, useState} from "react";
import useInterval from "../../utils/useInterval";
import UserData from "../../domain/UserData";
import ccxtConnector from "./ccxtConnector";
import AssetDTO from "../../domain/AssetDTO";
import ApiResponse from "../../domain/ApiResponse";

export interface CcxtAccountsData {
    [exchangeName: string]: AssetDTO[],
}

/** exchanges switched on in the wallet's saved settings */
export function savedEnabledCcxtIntegrations(userData: UserData): string[] {
    return Object.entries(userData.settings.integrations || {})
        .filter(([, integration]) => integration?.enabled)
        .map(([name]) => name)
        .sort();
}

/** Balances after a sync: each exchange that answered gets exactly what it answered (an empty
 *  list when everything was sold), one that failed keeps its last balances, and exchanges no
 *  longer switched on are dropped. */
export function mergeCcxtSync(
    saved: CcxtAccountsData,
    enabled: string[],
    answers: [string, ApiResponse<AssetDTO[]>][],
): CcxtAccountsData {
    const next: CcxtAccountsData = {};
    enabled.forEach(exchange => { if (saved[exchange]) next[exchange] = saved[exchange]; });
    answers.forEach(([exchange, response]) => {
        if (response.success) next[exchange] = response.result || [];
    });
    return next;
}

export default function CcxtLoader(
    loadingUserDataAllowed: boolean,
    storageFactory: StorageFactory,
    userData: UserData,
) {
    const getEnabledCcxtIntegrations = () => new Set(savedEnabledCcxtIntegrations(userData))

    // What the settings switches show: the saved flags, plus a switch flipped on that is still
    // being checked. It follows the saved flags whenever they change (an unlock or an import opens
    // other settings), not only when a dialog closes.
    const [enabledCcxtIntegrations, setEnabledCcxtIntegrations]
        = useState<Set<string>>(getEnabledCcxtIntegrations);
    const savedEnabled = savedEnabledCcxtIntegrations(userData).join(',');
    useEffect(() => {
        setEnabledCcxtIntegrations(getEnabledCcxtIntegrations());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [savedEnabled]);

    const [
        ccxtUserData,
        setCcxtUserData
    ] = storageFactory.createStorage<CcxtAccountsData>("ccxtUserData", () => ({} as CcxtAccountsData));

    // a sync started for one wallet must not land in another that replaced it meanwhile
    const walletId = useRef(userData.id);
    walletId.current = userData.id;

    // Syncs the exchanges switched on in the saved settings (not the switches, which may show a
    // change still being checked or not saved yet).
    const loadCcxtUserData = () => {
        if (!loadingUserDataAllowed) {
            return
        }
        const startedFor = userData.id;
        const integrations = userData.settings.integrations || {};
        const enabled = savedEnabledCcxtIntegrations(userData);
        Promise.all(enabled.map(exchange => ccxtConnector.loadUserData(
            exchange,
            integrations[exchange].apiKey,
            integrations[exchange].apiSecret,
            integrations[exchange].password,
            integrations[exchange].additionalSetting,
        ).catch((e: unknown) => ApiResponse.fail<AssetDTO[]>(0, String(e)))
            .then(response => [exchange, response] as [string, ApiResponse<AssetDTO[]>])))
            .then(answers => {
                if (walletId.current !== startedFor) return;
                setCcxtUserData(saved => mergeCcxtSync(saved, enabled, answers));
            })
    };
    // on start (a wallet already open), then every minute; ColdWallet also calls it right after
    // an unlock or an import, like the other exchanges
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(loadCcxtUserData, []);
    useInterval(loadCcxtUserData, 60_000);

    return {
        ccxtUserData, setCcxtUserData,
        enabledCcxtIntegrations,
        setEnabledCcxtIntegrations,
        getEnabledCcxtIntegrations,
        loadCcxtUserData,
    }
}
