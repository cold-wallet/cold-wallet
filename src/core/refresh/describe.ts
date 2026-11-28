// describe.ts — how a refresh button looks and what its tooltip says, from the refresh status.
import {
    activeOver,
    activeUnder,
    blockedUntil,
    errorsOver,
    errorsUnder,
    isUnder,
    lastSuccessUnder,
    RefreshStatus,
    retryAt,
    ScopeError,
    stateOf,
} from "./refreshState";
import {refreshMinGap, scopeLabel, sourceLabelOf} from "./scopes";

export interface ButtonView {
    /** something it covers is loading, or failed and will be retried */
    spinning: boolean;
    /** warn: a part failed and is being retried; error: a part won't load until something changes */
    tone: 'idle' | 'warn' | 'error';
    /** a rate limit holds the next request until then (0: a click works now) */
    blockedUntil: number;
    title: string;
}

/** "just now", "40 s ago", "3 min ago", "2 h ago" */
export function ago(at: number, now: number): string {
    const s = Math.max(0, Math.round((now - at) / 1000));
    if (s < 10) return 'just now';
    if (s < 60) return `${s} s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m} min ago`;
    return `${Math.round(m / 60)} h ago`;
}

const seconds = (ms: number) => `${Math.max(1, Math.ceil(ms / 1000))} s`;

type KeyedError = ScopeError & { key: string };

function errorLines(status: RefreshStatus, errors: KeyedError[], now: number, label: (key: string) => string): string[] {
    const lines: string[] = [];
    errors.filter(e => e.kind === 'retry').slice(0, 3).forEach(e => {
        const at = retryAt(stateOf(status, e.key), refreshMinGap(e.key));
        const when = stateOf(status, e.key).running > 0 ? 'retrying now' : `retrying in ${seconds(at - now)}`;
        lines.push(`${label(e.key)} failed: ${e.message} · ${when}`);
    });
    errors.filter(e => e.kind === 'fatal').slice(0, 3).forEach(e => {
        lines.push(`${label(e.key)}: ${e.message} · check this connection in Settings`);
    });
    const unavailable = errors.filter(e => e.kind === 'unavailable').map(e => label(e.key));
    if (unavailable.length) lines.push(`Not available: ${unavailable.join(', ')}`);
    return lines;
}

const toneOf = (errors: KeyedError[]): ButtonView['tone'] =>
    errors.some(e => e.kind === 'fatal') ? 'error' : errors.some(e => e.kind === 'retry') ? 'warn' : 'idle';

/** The button of a whole source ("binance", "ccxt:kraken") — or of everything, for prefix ''. */
export function sourceView(status: RefreshStatus, prefix: string, now: number): ButtonView {
    const keys = Object.keys(status).filter(k => isUnder(k, prefix));
    const spinning = activeUnder(status, prefix);
    const errors = errorsUnder(status, prefix);
    const everything = prefix === '';
    const name = everything ? 'everything' : sourceLabelOf(prefix);
    // a source waits out its rate limit only when every part of it does (Monobank: its only part)
    const waits = keys.map(k => blockedUntil(stateOf(status, k), now, refreshMinGap(k)));
    const blocked = !everything && keys.length > 0 && waits.every(w => w > 0) ? Math.min(...waits) : 0;
    const last = lastSuccessUnder(status, prefix);

    const lines: string[] = [];
    if (blocked) lines.push(`${name} allows one update per minute · available in ${seconds(blocked - now)}`);
    else if (spinning && !errors.some(e => e.kind === 'retry')) lines.push(`Updating ${name}…`);
    else lines.push(everything ? 'Refresh all' : `Refresh ${name}`);
    lines.push(...errorLines(status, errors, now, everything ? (k) => `${sourceLabelOf(k)} · ${scopeLabel(k)}` : scopeLabel));
    if (last) lines.push(`Updated ${ago(last, now)}`);
    return {spinning, tone: toneOf(errors), blockedUntil: blocked, title: lines.join('\n')};
}

/** The button of one holding: its own scope, plus the section / source above it. */
export function assetView(status: RefreshStatus, scope: string, now: number): ButtonView {
    const spinning = activeOver(status, scope);
    const errors = errorsOver(status, scope);
    const blocked = blockedUntil(stateOf(status, scope), now, refreshMinGap(scope));
    // loaded by itself or with the section / account above it, whichever was later
    const last = Math.max(0, ...Object.entries(status).filter(([k]) => isUnder(scope, k)).map(([, s]) => s.lastSuccessAt));
    const lines: string[] = [];
    if (blocked) lines.push(`${scopeLabel(scope)} can be updated once a minute · available in ${seconds(blocked - now)}`);
    else if (spinning && !errors.some(e => e.kind === 'retry')) lines.push('Updating…');
    else lines.push(scope.split('/').length > 2 || scope.startsWith('metamask/') ? 'Refresh balance' : `Refresh ${scopeLabel(scope)}`);
    lines.push(...errorLines(status, errors, now, scopeLabel));
    if (last) lines.push(`Updated ${ago(last, now)}`);
    return {spinning, tone: toneOf(errors), blockedUntil: blocked, title: lines.join('\n')};
}
