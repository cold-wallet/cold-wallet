import StorageFactory from "../../domain/StorageFactory";
import {useEffect, useRef, useState} from "react";
import useInterval from "../../utils/useInterval";
import UserData from "../../domain/UserData";
import ccxtConnector from "./ccxtConnector";
import {CCXT_REJECTED, CCXT_UNKNOWN_EXCHANGE} from "./ccxtErrors";
import {ccxtScope} from "../../refresh/scopeKeys";
import AssetDTO from "../../domain/AssetDTO";
import ApiResponse from "../../domain/ApiResponse";
import {RefreshTracker, useRetry, useScopedRunner} from "../../refresh/useRefreshTracker";
import {dueForPoll, FailKind, planManual, stateOf} from "../../refresh/refreshState";

const USER_DATA_INTERVAL_MS = 60_000;
const exchangeOfScope = (key: string) => key.slice('ccxt:'.length);
const isCcxtScope = (key: string) => key.startsWith('ccxt:');

export function ccxtFailKind(code: number): FailKind {
    return code === CCXT_REJECTED || code === CCXT_UNKNOWN_EXCHANGE ? 'fatal' : 'retry';
}

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
    tracker: RefreshTracker,
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
    // change still being checked or not saved yet). Exchanges load in parallel; each one's balances
    // and refresh button update as soon as it answers.
    const runner = useScopedRunner(tracker, false);
    const loadExchanges = (exchanges: string[], manual: boolean): Promise<void> => {
        if (!loadingUserDataAllowed) {
            return Promise.resolve();
        }
        const startedFor = userData.id;
        const integrations = userData.settings.integrations || {};
        const enabled = savedEnabledCcxtIntegrations(userData).filter(e => exchanges.includes(e));
        if (!enabled.length) return Promise.resolve();
        return runner(enabled.map(ccxtScope), manual, async (keys, settle) => {
            await Promise.all(keys.map(exchangeOfScope).map(exchange => ccxtConnector.loadUserData(
                exchange,
                integrations[exchange].apiKey,
                integrations[exchange].apiSecret,
                integrations[exchange].password,
                integrations[exchange].additionalSetting,
            ).catch((e: unknown) => {
                console.info(`could not sync ${exchange}`, e);
                return ApiResponse.fail<AssetDTO[]>(0, String(e));
            }).then(response => {
                const key = ccxtScope(exchange);
                if (openWallet.current.id !== startedFor) { settle.skip(key); return; }
                const enabledNow = savedEnabledCcxtIntegrations(openWallet.current);
                setCcxtUserData(saved => mergeCcxtSync(saved, enabledNow, [[exchange, response]]));
                if (response.success) settle.ok(key);
                else settle.fail(key, response.error || 'Balances did not load', ccxtFailKind(response.code));
            })));
        });
    };

    // polling: every exchange switched on, except those that loaded meanwhile (a manual refresh)
    const loadCcxtUserData = () => {
        const now = Date.now();
        const status = tracker.current();
        void loadExchanges(savedEnabledCcxtIntegrations(userData)
            .filter(exchange => dueForPoll(stateOf(status, ccxtScope(exchange)), now, USER_DATA_INTERVAL_MS)), false);
    };
    // on start (a wallet already open), then every minute; ColdWallet also calls it right after
    // an unlock or an import, like the other exchanges
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(loadCcxtUserData, []);
    useInterval(loadCcxtUserData, USER_DATA_INTERVAL_MS);
    useRetry(tracker, '', keys => {
        const exchanges = keys.filter(isCcxtScope).map(exchangeOfScope);
        if (exchanges.length) void loadExchanges(exchanges, false);
    });

    // an exchange switched off: its refresh state goes too
    useEffect(() => {
        const on = savedEnabledCcxtIntegrations(userData);
        tracker.forget(k => isCcxtScope(k) && !on.includes(exchangeOfScope(k)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [savedEnabled]);

    /** Manual refresh of these exchanges (default: all switched on); fresh ones answer at once. */
    const refreshCcxt = (exchanges: string[] = savedEnabledCcxtIntegrations(userData)): Promise<void> => {
        const plan = planManual(tracker.current(), exchanges.map(ccxtScope), Date.now());
        tracker.pulse(plan.fresh);
        return loadExchanges(plan.fetch.map(exchangeOfScope), true);
    };

    return {
        ccxtUserData, setCcxtUserData,
        enabledCcxtIntegrations,
        setEnabledCcxtIntegrations,
        getEnabledCcxtIntegrations,
        loadCcxtUserData,
        refreshCcxt,
    }
}
