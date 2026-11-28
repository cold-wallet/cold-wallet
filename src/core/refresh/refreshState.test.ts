import {
    activeOver,
    activeUnder,
    begin,
    blockedUntil,
    dueForPoll,
    errorsUnder,
    fail,
    forget,
    isUnder,
    lastSuccessUnder,
    planManual,
    RefreshStatus,
    retryAt,
    retryDue,
    settle,
    stateOf,
    succeed,
} from './refreshState';

const T = 1_000_000;

describe('scope keys', () => {
    it('nest with "/" only', () => {
        expect(isUnder('binance/spot', 'binance')).toBe(true);
        expect(isUnder('binance', 'binance')).toBe(true);
        expect(isUnder('binance-x/spot', 'binance')).toBe(false);
        expect(isUnder('okx/spot/BTC', 'okx/spot')).toBe(true);
        expect(isUnder('anything', '')).toBe(true);
    });
});

describe('a source refresh, section by section', () => {
    let s: RefreshStatus = {};
    beforeEach(() => {
        s = begin({}, ['binance/spot', 'binance/funding'], T, true);
    });

    it('spins the source and every holding of it until its own section is done', () => {
        expect(activeUnder(s, 'binance')).toBe(true);
        expect(activeOver(s, 'binance/spot')).toBe(true);

        s = succeed(s, 'binance/spot', T + 500);
        expect(activeOver(s, 'binance/spot')).toBe(false);   // spot holdings stop
        expect(activeOver(s, 'binance/funding')).toBe(true); // funding ones keep going
        expect(activeUnder(s, 'binance')).toBe(true);        // and so does the source

        s = succeed(s, 'binance/funding', T + 900);
        expect(activeUnder(s, 'binance')).toBe(false);
        expect(activeUnder(s, '')).toBe(false);
    });

    it('a failure to retry keeps spinning until a retry succeeds', () => {
        s = succeed(s, 'binance/spot', T + 500);
        s = fail(s, 'binance/funding', T + 600, 'timeout', 'retry');
        expect(activeUnder(s, 'binance')).toBe(true);
        expect(errorsUnder(s, 'binance').map(e => e.key)).toEqual(['binance/funding']);
        s = succeed(begin(s, ['binance/funding'], T + 20_000, false), 'binance/funding', T + 21_000);
        expect(activeUnder(s, 'binance')).toBe(false);
        expect(errorsUnder(s, 'binance')).toEqual([]);
    });

    it('a failure that will not pass, or a part not offered, stops spinning', () => {
        s = fail(s, 'binance/spot', T + 500, 'Invalid API-key', 'fatal');
        s = fail(s, 'binance/funding', T + 600, 'No permission', 'unavailable');
        expect(activeUnder(s, 'binance')).toBe(false);
        expect(errorsUnder(s, 'binance').map(e => e.kind).sort()).toEqual(['fatal', 'unavailable']);
    });

    it('"updated … ago" holds for every part: the oldest success counts', () => {
        s = succeed(s, 'binance/spot', T + 5_000);
        s = succeed(s, 'binance/funding', T + 1_000);
        expect(lastSuccessUnder(s, 'binance')).toBe(T + 1_000);
        expect(lastSuccessUnder(s, 'okx')).toBe(0);
    });

    it('forgets the scopes of a source switched off', () => {
        s = forget(s, k => isUnder(k, 'binance'));
        expect(s).toEqual({});
    });
});

describe('rate limits and fresh data', () => {
    const MIN = 60_000;

    it('after a manual request the button waits out the limit', () => {
        const s = succeed(begin({}, ['monobank'], T, true), 'monobank', T + 300);
        expect(blockedUntil(stateOf(s, 'monobank'), T + 10_000, MIN)).toBe(T + MIN);
        expect(blockedUntil(stateOf(s, 'monobank'), T + MIN, MIN)).toBe(0);
        expect(planManual(s, ['monobank'], T + 10_000, {minGapMs: () => MIN}).blocked).toEqual(['monobank']);
    });

    it('after a successful automatic request a click is answered from that fresh data', () => {
        const s = succeed(begin({}, ['monobank'], T, false), 'monobank', T + 300);
        expect(blockedUntil(stateOf(s, 'monobank'), T + 10_000, MIN)).toBe(0);
        expect(planManual(s, ['monobank'], T + 10_000, {minGapMs: () => MIN, freshMs: () => MIN}))
            .toEqual({fetch: [], fresh: ['monobank'], blocked: []});
    });

    it('after a failed automatic request the button waits too: a click could not load anything', () => {
        const s = fail(begin({}, ['monobank'], T, false), 'monobank', T + 300, '429', 'retry');
        expect(blockedUntil(stateOf(s, 'monobank'), T + 10_000, MIN)).toBe(T + MIN);
    });

    it('data under 10 s old is fresh; older, or a request on its way, loads (or joins it)', () => {
        let s = succeed(begin({}, ['okx/spot', 'okx/sub'], T, false), 'okx/spot', T + 100);
        s = succeed(s, 'okx/sub', T - 20_000 + 100);
        s = begin(s, ['ccxt:kraken'], T, false);
        expect(planManual(s, ['okx/spot', 'okx/sub', 'ccxt:kraken'], T + 5_000))
            .toEqual({fetch: ['okx/sub', 'ccxt:kraken'], fresh: ['okx/spot'], blocked: []});
    });

    it('a failed part is not fresh', () => {
        const s = fail(succeed(begin({}, ['okx/spot'], T, false), 'okx/spot', T), 'okx/spot', T + 100, 'x', 'retry');
        expect(planManual(s, ['okx/spot'], T + 2_000).fetch).toEqual(['okx/spot']);
    });
});

describe('retries', () => {
    it('back off 15 s, 30 s, then every 60 s', () => {
        let s = fail(begin({}, ['okx/spot'], T, false), 'okx/spot', T, 'x', 'retry');
        expect(retryAt(stateOf(s, 'okx/spot'))).toBe(T + 15_000);
        s = fail(begin(s, ['okx/spot'], T + 15_000, false), 'okx/spot', T + 15_000, 'x', 'retry');
        expect(retryAt(stateOf(s, 'okx/spot'))).toBe(T + 45_000);
        s = fail(begin(s, ['okx/spot'], T + 45_000, false), 'okx/spot', T + 45_000, 'x', 'retry');
        s = fail(begin(s, ['okx/spot'], T + 105_000, false), 'okx/spot', T + 105_000, 'x', 'retry');
        expect(retryAt(stateOf(s, 'okx/spot'))).toBe(T + 165_000);
    });

    it('never before the rate limit allows, and not while a request is on its way', () => {
        const s = fail(begin({}, ['monobank'], T, false), 'monobank', T + 1_000, '429', 'retry');
        expect(retryAt(stateOf(s, 'monobank'), 60_000)).toBe(T + 60_000);
        expect(retryDue(stateOf(s, 'monobank'), T + 30_000, 60_000)).toBe(false);
        expect(retryDue(stateOf(s, 'monobank'), T + 60_000, 60_000)).toBe(true);
        expect(retryDue(stateOf(begin(s, ['monobank'], T + 60_000, false), 'monobank'), T + 61_000, 60_000)).toBe(false);
    });

    it('are not scheduled for failures that will not pass', () => {
        const s = fail(begin({}, ['okx/spot'], T, false), 'okx/spot', T, 'bad key', 'fatal');
        expect(retryDue(stateOf(s, 'okx/spot'), T + 999_999)).toBe(false);
    });
});

describe('polling', () => {
    it('skips data a manual refresh just loaded, so the next poll moves back', () => {
        const s = succeed(begin({}, ['ccxt:kraken'], T, true), 'ccxt:kraken', T);
        expect(dueForPoll(stateOf(s, 'ccxt:kraken'), T + 30_000, 60_000)).toBe(false);
        expect(dueForPoll(stateOf(s, 'ccxt:kraken'), T + 56_000, 60_000)).toBe(true);
        expect(dueForPoll(stateOf({}, 'ccxt:kraken'), T, 60_000)).toBe(true);
    });

    it('an answer from fresh data does not count as a request', () => {
        const s = settle(begin({}, ['okx/spot'], T, true, false), 'okx/spot');
        expect(stateOf(s, 'okx/spot')).toMatchObject({running: 0, lastAttemptAt: 0, lastSuccessAt: 0});
    });
});
