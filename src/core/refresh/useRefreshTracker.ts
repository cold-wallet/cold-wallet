// useRefreshTracker — the refresh status of every source, shared by the loaders (which report what
// they load) and the dashboard (which shows it on the refresh buttons). See refreshState.ts.
import {useCallback, useMemo, useRef, useState} from "react";
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

/** How long a refresh answered from fresh data spins, so the click visibly did something. */
export const FRESH_PULSE_MS = 500;

export interface RefreshTracker {
    status: RefreshStatus;
    /** the latest status, also between renders (for loaders deciding what to load) */
    current: () => RefreshStatus;
    /** Requests for `keys` start. Returns a ticket for reporting their outcome: outcomes of a ticket
     *  issued before the last reset (a lock, another wallet) are ignored. */
    begin: (keys: string[], manual: boolean) => number;
    succeed: (ticket: number, key: string) => void;
    fail: (ticket: number, key: string, message: string, kind: FailKind) => void;
    settle: (ticket: number, key: string) => void;
    /** answer a click from fresh data: the buttons spin briefly, nothing is requested */
    pulse: (keys: string[]) => void;
    /** forget scopes (an integration switched off) */
    forget: (drop: (key: string) => boolean) => void;
    /** forget everything (the wallet locked or another one opened) */
    reset: () => void;
}

export default function useRefreshTracker(): RefreshTracker {
    const ref = useRef<RefreshStatus>({});
    const ticket = useRef(1);
    const [status, setStatus] = useState<RefreshStatus>({});

    const apply = useCallback((next: RefreshStatus) => {
        if (next === ref.current) return;
        ref.current = next;
        setStatus(next);
    }, []);

    const current = useCallback(() => ref.current, []);
    const begin = useCallback((keys: string[], manual: boolean) => {
        if (keys.length) apply(beginRun(ref.current, keys, Date.now(), manual));
        return ticket.current;
    }, [apply]);
    const succeed = useCallback((t: number, key: string) => {
        if (t === ticket.current) apply(succeedRun(ref.current, key, Date.now()));
    }, [apply]);
    const fail = useCallback((t: number, key: string, message: string, kind: FailKind) => {
        if (t === ticket.current) apply(failRun(ref.current, key, Date.now(), message, kind));
    }, [apply]);
    const settle = useCallback((t: number, key: string) => {
        if (t === ticket.current) apply(settleRun(ref.current, key));
    }, [apply]);
    const pulse = useCallback((keys: string[]) => {
        if (!keys.length) return;
        apply(beginRun(ref.current, keys, Date.now(), true, false));
        const t = ticket.current;
        setTimeout(() => keys.forEach((k) => settle(t, k)), FRESH_PULSE_MS);
    }, [apply, settle]);
    const forget = useCallback((drop: (key: string) => boolean) => apply(forgetScopes(ref.current, drop)), [apply]);
    const reset = useCallback(() => {
        ticket.current++;
        apply({});
    }, [apply]);

    return useMemo(() => ({status, current, begin, succeed, fail, settle, pulse, forget, reset}),
        [status, current, begin, succeed, fail, settle, pulse, forget, reset]);
}

export type Settle = {
    ok: (key: string) => void;
    fail: (key: string, message: string, kind: FailKind) => void;
    /** no news for this key (dropped, or answered for a wallet no longer open) */
    skip: (key: string) => void;
};

/**
 * De-duplicating runner for one source's requests. `run(keys, manual, work)` reports `keys` as
 * loading and calls `work` with the keys that aren't already queued or on their way (a key whose
 * scope or a scope above it is queued is joined instead). Serial runners queue each call behind
 * the previous one, so requests to one API never overlap; parallel ones only de-duplicate.
 * `work` reports every key through `settle`; keys it leaves unreported fail as 'retry'.
 * The returned promise ends when the work for all of `keys` (including joined runs) is done.
 */
export function useScopedRunner(tracker: RefreshTracker, serial: boolean) {
    const tail = useRef<Promise<void>>(Promise.resolve());
    const queued = useRef(new Map<string, Promise<void>>());
    const trackerRef = useRef(tracker);
    trackerRef.current = tracker;

    return useCallback((keys: string[], manual: boolean,
                        work: (keys: string[], settle: Settle) => Promise<void>): Promise<void> => {
        const joined: Promise<void>[] = [];
        const fresh: string[] = [];
        keys.forEach((key) => {
            const covering = Array.from(queued.current.entries()).find(([q]) => isUnder(key, q));
            if (covering) joined.push(covering[1]);
            else fresh.push(key);
        });
        if (!fresh.length) return Promise.all(joined).then(() => undefined);

        const t = trackerRef.current;
        const ticket = t.begin(fresh, manual);
        const open = new Set(fresh);
        const report = (key: string, f: () => void) => {
            if (!open.delete(key)) return;
            queued.current.delete(key);
            f();
        };
        const settle: Settle = {
            ok: (key) => report(key, () => t.succeed(ticket, key)),
            fail: (key, message, kind) => report(key, () => t.fail(ticket, key, message, kind)),
            skip: (key) => report(key, () => t.settle(ticket, key)),
        };
        const start = serial ? tail.current : Promise.resolve();
        const done = start
            .then(() => work(fresh, settle))
            .catch((e: unknown) => {
                console.warn('refresh failed', e);
            })
            .finally(() => {
                Array.from(open).forEach((key) => settle.fail(key, 'Request did not finish', 'retry'));
            });
        fresh.forEach((key) => queued.current.set(key, done));
        if (serial) tail.current = done;
        return Promise.all([done, ...joined]).then(() => undefined);
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
