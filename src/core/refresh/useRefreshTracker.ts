// useRefreshTracker — the refresh status of every source, shared by the loaders (which report what
// they load) and the refresh buttons (which show it). See refreshState.ts.
//
// It is an external store, not React state: a change re-renders only the components that read it
// (the buttons, via useRefreshStatus), not the whole dashboard with its charts, which would
// otherwise redraw several times per polling cycle.
import {useCallback, useMemo, useRef, useSyncExternalStore} from "react";
import useInterval from "../utils/useInterval";
import {
    begin as beginRun,
    FailKind,
    fail as failRun,
    forget as forgetScopes,
    isUnder,
    RefreshStatus,
    retryDue,
    settle as settleRun,
    succeed as succeedRun,
} from "./refreshState";

/** Market data (prices, rates, market lists) isn't any wallet's: a lock or another wallet keeps
 *  its status, and its requests on their way still count. */
export const isMarketScope = (key: string) => key.startsWith('prices/');

/** How long a refresh answered from fresh data spins, so the click visibly did something. */
export const FRESH_PULSE_MS = 500;

/** What a component needs to read the status and hear about its changes. */
export interface RefreshStore {
    /** the latest status */
    current: () => RefreshStatus;
    subscribe: (listener: () => void) => () => void;
}

export interface RefreshTracker extends RefreshStore {
    /** The wallet generation: it changes on every reset (a lock, another wallet). Requests started
     *  before it changed belong to a wallet that is closed now. */
    ticket: () => number;
    /** Requests for `keys` start. Returns the ticket to report their outcome with: outcomes of an
     *  earlier ticket are ignored, except for market data. */
    begin: (keys: string[], manual: boolean) => number;
    succeed: (ticket: number, key: string) => void;
    fail: (ticket: number, key: string, message: string, kind: FailKind) => void;
    settle: (ticket: number, key: string) => void;
    /** answer a click from fresh data: the buttons spin briefly, nothing is requested */
    pulse: (keys: string[]) => void;
    /** forget scopes (an integration switched off) */
    forget: (drop: (key: string) => boolean) => void;
    /** forget the wallet's sources (it locked, or another one opened); market data stays */
    reset: () => void;
}

/** The status, re-rendering the calling component whenever it changes. */
export function useRefreshStatus(store: RefreshStore): RefreshStatus {
    return useSyncExternalStore(store.subscribe, store.current);
}

export default function useRefreshTracker(): RefreshTracker {
    const ref = useRef<RefreshStatus>({});
    const ticketRef = useRef(1);
    const listeners = useRef(new Set<() => void>());

    const apply = useCallback((next: RefreshStatus) => {
        if (next === ref.current) return;
        ref.current = next;
        listeners.current.forEach((listener) => listener());
    }, []);

    const current = useCallback(() => ref.current, []);
    const subscribe = useCallback((listener: () => void) => {
        listeners.current.add(listener);
        return () => { listeners.current.delete(listener); };
    }, []);
    const ticket = useCallback(() => ticketRef.current, []);
    // an outcome counts unless it belongs to a wallet closed since the request started
    const counts = (t: number, key: string) => t === ticketRef.current || isMarketScope(key);
    const begin = useCallback((keys: string[], manual: boolean) => {
        if (keys.length) apply(beginRun(ref.current, keys, Date.now(), manual));
        return ticketRef.current;
    }, [apply]);
    const succeed = useCallback((t: number, key: string) => {
        if (counts(t, key)) apply(succeedRun(ref.current, key, Date.now()));
    }, [apply]);
    const fail = useCallback((t: number, key: string, message: string, kind: FailKind) => {
        if (counts(t, key)) apply(failRun(ref.current, key, Date.now(), message, kind));
    }, [apply]);
    const settle = useCallback((t: number, key: string) => {
        if (counts(t, key)) apply(settleRun(ref.current, key));
    }, [apply]);
    const pulse = useCallback((keys: string[]) => {
        if (!keys.length) return;
        apply(beginRun(ref.current, keys, Date.now(), true, false));
        const t = ticketRef.current;
        setTimeout(() => keys.forEach((k) => settle(t, k)), FRESH_PULSE_MS);
    }, [apply, settle]);
    const forget = useCallback((drop: (key: string) => boolean) => apply(forgetScopes(ref.current, drop)), [apply]);
    const reset = useCallback(() => {
        ticketRef.current++;
        apply(forgetScopes(ref.current, (key) => !isMarketScope(key)));
    }, [apply]);

    return useMemo(() => ({current, subscribe, ticket, begin, succeed, fail, settle, pulse, forget, reset}),
        [current, subscribe, ticket, begin, succeed, fail, settle, pulse, forget, reset]);
}

export type Settle = {
    ok: (key: string) => void;
    fail: (key: string, message: string, kind: FailKind) => void;
    /** no news for this key (dropped, or answered for a wallet no longer open) */
    skip: (key: string) => void;
    /** The wallet this work was started for is still the open one. Check it before storing a
     *  result: an answer for a wallet that was locked or replaced meanwhile must not land. */
    live: () => boolean;
};

interface QueuedRun {
    done: Promise<void>;
    ticket: number;
}

/**
 * De-duplicating runner for one source's requests. `run(keys, manual, work)` reports `keys` as
 * loading and calls `work` with the keys that aren't already queued or on their way (a key whose
 * scope or a scope above it is queued is joined instead — unless that request belongs to a wallet
 * closed since, which a new one must not wait for). Serial runners queue each call behind the
 * previous one, so requests to one API never overlap; parallel ones only de-duplicate.
 * `work` reports every key through `settle`; keys it leaves unreported fail as 'retry'.
 * The returned promise ends when the work for all of `keys` (including joined runs) is done.
 */
export function useScopedRunner(tracker: RefreshTracker, serial: boolean) {
    const tail = useRef<Promise<void>>(Promise.resolve());
    const queued = useRef(new Map<string, QueuedRun>());
    const trackerRef = useRef(tracker);
    trackerRef.current = tracker;

    return useCallback((keys: string[], manual: boolean,
                        work: (keys: string[], settle: Settle) => Promise<void>): Promise<void> => {
        const t = trackerRef.current;
        const now = t.ticket();
        const joined: Promise<void>[] = [];
        const fresh: string[] = [];
        keys.forEach((key) => {
            const covering = Array.from(queued.current.entries())
                .find(([q, run]) => isUnder(key, q) && (run.ticket === now || isMarketScope(key)));
            if (covering) joined.push(covering[1].done);
            else fresh.push(key);
        });
        if (!fresh.length) return Promise.all(joined).then(() => undefined);

        const ticket = t.begin(fresh, manual);
        const open = new Set(fresh);
        const entry: QueuedRun = {done: Promise.resolve(), ticket};
        const report = (key: string, f: () => void) => {
            if (!open.delete(key)) return;
            // only our own entry: a newer run for this key may have taken its place
            if (queued.current.get(key) === entry) queued.current.delete(key);
            f();
        };
        const settle: Settle = {
            ok: (key) => report(key, () => t.succeed(ticket, key)),
            fail: (key, message, kind) => report(key, () => t.fail(ticket, key, message, kind)),
            skip: (key) => report(key, () => t.settle(ticket, key)),
            live: () => t.ticket() === ticket,
        };
        const start = serial ? tail.current : Promise.resolve();
        entry.done = start
            .then(() => work(fresh, settle))
            .catch((e: unknown) => {
                console.warn('refresh failed', e);
            })
            .finally(() => {
                Array.from(open).forEach((key) => settle.fail(key, 'Request did not finish', 'retry'));
            });
        fresh.forEach((key) => queued.current.set(key, entry));
        if (serial) tail.current = entry.done;
        return Promise.all([entry.done, ...joined]).then(() => undefined);
    }, [serial]);
}

/** Retries the failed scopes under `prefix` when their back-off (and rate limit) allows. */
export function useRetry(tracker: RefreshTracker, prefix: string, retry: (keys: string[]) => void,
                         minGapMs: (key: string) => number = () => 0, enabled = true) {
    useInterval(() => {
        const now = Date.now();
        const due = Object.entries(tracker.current())
            .filter(([k, s]) => isUnder(k, prefix) && retryDue(s, now, minGapMs(k)))
            .map(([k]) => k);
        if (due.length) retry(due);
    }, enabled ? 2_000 : null);
}
