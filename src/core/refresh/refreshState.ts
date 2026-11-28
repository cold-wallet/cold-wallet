// refreshState.ts — what is being refreshed, what failed and how fresh each part of the data is.
//
// Every refreshable part of the data has a scope key. Keys nest with "/": "binance" is the whole
// integration, "binance/spot" one of its sections, "okx/spot/BTC" one coin of OKX's spot account.
// A ccxt exchange is "ccxt:<exchange>", prices are "prices/<source>". Buttons look at the keys under
// their own (a source button at every section of it) or above it (an asset button at its section and
// the whole source), so a source refresh spins every asset button until that asset's part is done.
//
// Pure functions over an immutable map; useRefreshTracker keeps the map in React.

/** How a failed request ends:
 *  - retry: worth trying again (network, rate limit). The button keeps spinning until it succeeds.
 *  - fatal: won't pass by itself (bad keys, no access). The button stops and shows an error.
 *  - unavailable: this part isn't offered for this account (e.g. no futures permission on the key).
 *    No spinning, no alarm, just a note in the tooltip. */
export type FailKind = 'retry' | 'fatal' | 'unavailable';

export interface ScopeError {
    message: string;
    at: number;
    kind: FailKind;
}

export interface ScopeState {
    /** requests queued or in flight for this scope */
    running: number;
    /** when the last real request for it started (0: never) */
    lastAttemptAt: number;
    /** the last real request was started by the user */
    lastAttemptManual: boolean;
    /** when it last loaded successfully (0: not this session) */
    lastSuccessAt: number;
    /** failed requests in a row, for the retry back-off */
    failures: number;
    /** the last request failed (cleared by a success) */
    error: ScopeError | null;
}

export type RefreshStatus = Readonly<Record<string, ScopeState>>;

export const IDLE: ScopeState = Object.freeze({
    running: 0, lastAttemptAt: 0, lastAttemptManual: false, lastSuccessAt: 0, failures: 0, error: null,
});

/** Data loaded this recently is fresh: a manual refresh answers at once without a request. */
export const FRESH_MS = 10_000;
/** Retry delays after a failure: 15 s, 30 s, then every 60 s. */
export const RETRY_DELAYS_MS = [15_000, 30_000, 60_000];

export const stateOf = (status: RefreshStatus, key: string): ScopeState => status[key] || IDLE;

/** `key` is `prefix` itself or nested under it ("binance/spot" is under "binance"). */
export const isUnder = (key: string, prefix: string): boolean =>
    prefix === '' || key === prefix || key.startsWith(prefix + '/');

const update = (status: RefreshStatus, key: string, change: (s: ScopeState) => ScopeState): RefreshStatus =>
    ({ ...status, [key]: change(stateOf(status, key)) });

/** Requests for `keys` were queued. `attempt` false: an answer without a request (fresh data). */
export function begin(status: RefreshStatus, keys: string[], now: number, manual: boolean, attempt = true): RefreshStatus {
    return keys.reduce((next, key) => update(next, key, (s) => ({
        ...s,
        running: s.running + 1,
        ...(attempt ? { lastAttemptAt: now, lastAttemptManual: manual } : {}),
    })), status);
}

export function succeed(status: RefreshStatus, key: string, now: number): RefreshStatus {
    return update(status, key, (s) => ({
        ...s, running: Math.max(0, s.running - 1), lastSuccessAt: now, failures: 0, error: null,
    }));
}

export function fail(status: RefreshStatus, key: string, now: number, message: string, kind: FailKind): RefreshStatus {
    return update(status, key, (s) => ({
        ...s,
        running: Math.max(0, s.running - 1),
        failures: s.failures + 1,
        error: { message, at: now, kind },
    }));
}

/** A run ended without news for this scope (answered from fresh data, or dropped). */
export function settle(status: RefreshStatus, key: string): RefreshStatus {
    return update(status, key, (s) => ({ ...s, running: Math.max(0, s.running - 1) }));
}

/** Forget the scopes matching `drop` (an integration switched off, an asset that went away). */
export function forget(status: RefreshStatus, drop: (key: string) => boolean): RefreshStatus {
    const keys = Object.keys(status).filter(drop);
    if (!keys.length) return status;
    const next = { ...status };
    keys.forEach((k) => delete next[k]);
    return next;
}

// ----- reading it -----

/** The scope is busy: a request is on its way, or it failed and a retry will follow. */
export const isActive = (s: ScopeState): boolean => s.running > 0 || s.error?.kind === 'retry';

/** Some scope under `prefix` is busy ('' = anything at all). */
export function activeUnder(status: RefreshStatus, prefix: string): boolean {
    return Object.entries(status).some(([k, s]) => isUnder(k, prefix) && isActive(s));
}

/** `key` itself or a scope above it is busy (an asset spins while its section or source loads). */
export function activeOver(status: RefreshStatus, key: string): boolean {
    return Object.entries(status).some(([k, s]) => isUnder(key, k) && isActive(s));
}

/** Errors of the scopes under `prefix`, most recent first. */
export function errorsUnder(status: RefreshStatus, prefix: string): (ScopeError & { key: string })[] {
    return Object.entries(status)
        .filter(([k, s]) => isUnder(k, prefix) && s.error)
        .map(([key, s]) => ({ key, ...(s.error as ScopeError) }))
        .sort((a, b) => b.at - a.at);
}

/** Errors of `key` and the scopes above it. */
export function errorsOver(status: RefreshStatus, key: string): (ScopeError & { key: string })[] {
    return Object.entries(status)
        .filter(([k, s]) => isUnder(key, k) && s.error)
        .map(([k, s]) => ({ key: k, ...(s.error as ScopeError) }))
        .sort((a, b) => b.at - a.at);
}

/** When everything under `prefix` that ever loaded had last loaded: the oldest of those times
 *  (so "updated 2 min ago" holds for all of it). 0 when nothing loaded yet. */
export function lastSuccessUnder(status: RefreshStatus, prefix: string): number {
    const times = Object.entries(status)
        .filter(([k, s]) => isUnder(k, prefix) && s.lastSuccessAt > 0)
        .map(([, s]) => s.lastSuccessAt);
    return times.length ? Math.min(...times) : 0;
}

/** The data loaded successfully within `windowMs` and nothing failed since. */
export const isFresh = (s: ScopeState, now: number, windowMs: number): boolean =>
    !s.error && s.lastSuccessAt > 0 && now - s.lastSuccessAt < windowMs;

/** A rate limit allows one request per `minGapMs`. The button waits it out after a manual request
 *  or a failure: then a click can't load anything new. After a successful automatic request the
 *  data is that fresh anyway, so a click is answered from it instead (see planManual).
 *  Returns when a request is allowed again, 0 when it is now. */
export function blockedUntil(s: ScopeState, now: number, minGapMs: number): number {
    if (!minGapMs || !s.lastAttemptAt || s.running > 0) return 0;
    if (!s.lastAttemptManual && !s.error) return 0;
    const at = s.lastAttemptAt + minGapMs;
    return at > now ? at : 0;
}

/** When a failed scope is retried: back-off by failures in a row, never before the rate limit. */
export function retryAt(s: ScopeState, minGapMs = 0): number {
    if (s.error?.kind !== 'retry') return 0;
    const delay = RETRY_DELAYS_MS[Math.min(s.failures, RETRY_DELAYS_MS.length) - 1] ?? RETRY_DELAYS_MS[0];
    return Math.max(s.error.at + delay, s.lastAttemptAt + minGapMs);
}

export const retryDue = (s: ScopeState, now: number, minGapMs = 0): boolean =>
    s.running === 0 && s.error?.kind === 'retry' && now >= retryAt(s, minGapMs);

/** A polling tick skips data that loaded within its interval (less 5 s of slack), so a manual
 *  refresh moves the next automatic one back instead of being followed by it at once. */
export const dueForPoll = (s: ScopeState, now: number, intervalMs: number): boolean =>
    s.running === 0 && !(s.lastSuccessAt > 0 && !s.error && now - s.lastSuccessAt < intervalMs - 5_000);

export interface ScopeLimits {
    /** answered without a request when loaded this recently (default FRESH_MS) */
    freshMs?: (key: string) => number;
    /** a rate limit: at most one request per this many ms (default none) */
    minGapMs?: (key: string) => number;
}

/** What a click on refresh does for each scope: load it (or join the request already on its way),
 *  answer from fresh data, or nothing yet (rate limit). */
export function planManual(status: RefreshStatus, keys: string[], now: number, limits: ScopeLimits = {}):
    { fetch: string[]; fresh: string[]; blocked: string[] } {
    const plan = { fetch: [] as string[], fresh: [] as string[], blocked: [] as string[] };
    keys.forEach((key) => {
        const s = stateOf(status, key);
        if (s.running > 0) plan.fetch.push(key);
        else if (blockedUntil(s, now, limits.minGapMs?.(key) ?? 0)) plan.blocked.push(key);
        else if (isFresh(s, now, limits.freshMs?.(key) ?? FRESH_MS)) plan.fresh.push(key);
        else plan.fetch.push(key);
    });
    return plan;
}
