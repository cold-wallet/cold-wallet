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
 *  list when everything was sold), one that failed keeps its last balances. Answers only count
 *  for exchanges still switched on (`enabled`, as of when they land); every other exchange keeps
 *  what it has, so one switched on meanwhile keeps the balances its check just loaded. Exchanges
 *  switched off are dropped by `keepEnabledCcxt`, not here. */
export function mergeCcxtSync(
    saved: CcxtAccountsData,
    enabled: string[],
    answers: [string, ApiResponse<AssetDTO[]>][],
): CcxtAccountsData {
    const next: CcxtAccountsData = { ...saved };
    answers.forEach(([exchange, response]) => {
        if (response.success && enabled.includes(exchange)) next[exchange] = response.result || [];
    });
    return next;
}

/** Drops the saved balances of exchanges not switched on (unchanged object when there are none). */
export function keepEnabledCcxt(saved: CcxtAccountsData, enabled: string[]): CcxtAccountsData {
    const dropped = Object.keys(saved).filter(exchange => !enabled.includes(exchange));
    if (!dropped.length) return saved;
    const next = { ...saved };
    dropped.forEach(exchange => delete next[exchange]);
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

    // The wallet open now, for syncs that land later: one started for a wallet that was replaced
    // meanwhile is dropped, and the others count only for exchanges still switched on.
    const openWallet = useRef(userData);
    openWallet.current = userData;

    // Balances of an exchange switched off go once its saved flag says so (also right after an
    // unlock or an import, for the settings just opened). Not while the wallet is locked: its
    // settings aren't readable then, so nothing would look switched on.
    useEffect(() => {
        if (!loadingUserDataAllowed) return;
        setCcxtUserData(saved => keepEnabledCcxt(saved, savedEnabledCcxtIntegrations(userData)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [savedEnabled, loadingUserDataAllowed]);

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
        ).catch((e: unknown) => {
            console.info(`could not sync ${exchange}`, e);
            return ApiResponse.fail<AssetDTO[]>(0, String(e));
        })
            .then(response => [exchange, response] as [string, ApiResponse<AssetDTO[]>])))
            .then(answers => {
                if (openWallet.current.id !== startedFor) return;
                const enabledNow = savedEnabledCcxtIntegrations(openWallet.current);
                setCcxtUserData(saved => mergeCcxtSync(saved, enabledNow, answers));
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
