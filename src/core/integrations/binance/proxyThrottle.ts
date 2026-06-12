// proxyThrottle.ts — adaptive rate-limiter for the Binance AWS CORS proxy.
//
// The proxy (and Binance's own SAPI weight limits behind it) returns 429 WITHOUT CORS headers,
// so the browser sees a generic opaque failure — we can't read the status. A user-data refresh
// fires ~10 signed calls; un-spaced they burst and trip a small token bucket ("sometimes passes").
//
// So: serialize every proxy call onto one chain (≤1 in-flight), space them MIN_GAP_MS apart, and
// on an opaque failure back off (exponential + jitter) and retry. The pauseUntil window also
// delays every queued call, so one throttle slows the whole sequence instead of hammering. Real
// auth/param errors (Binance error codes) are NOT retried. Mirrors the CoinGecko `pauseUntil` /
// MetaMask `scanPauseUntil` patterns already in the repo.

const MIN_GAP_MS = 700;       // minimum spacing between two proxy requests
const MAX_RETRIES = 3;        // attempts beyond the first, for retryable (throttle) failures
const BASE_BACKOFF_MS = 1500; // first backoff; doubles each retry
const MAX_BACKOFF_MS = 20_000;

// Binance error codes that are themselves rate limits → worth retrying even though they parsed.
const RETRYABLE_BINANCE_CODES = new Set([-1003, -1015]); // TOO_MANY_REQUESTS / TOO_MANY_ORDERS
const RETRYABLE_HTTP = new Set([429, 418, 500, 502, 503, 504]);

let chain: Promise<unknown> = Promise.resolve(); // serializes all proxy calls
let lastRequestAt = 0;                            // for MIN_GAP_MS spacing
let pauseUntil = 0;                               // backoff window (also delays queued calls)

let cycleCalls = 0;
let cycleRetries = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Opaque/CORS-masked failures and 429/5xx are the throttle case → retry. A parsed Binance error
 *  with a negative `.code` is a real API error (bad key, bad param) → don't retry, EXCEPT the
 *  rate-limit codes. Defaulting opaque errors to retryable is the whole point: a CORS-masked 429
 *  carries no body, so it lands here with no `code` and no `response`. */
export function isRetryable(e: any): boolean {
  const code = e?.code;
  if (typeof code === 'number' && code < 0) return RETRYABLE_BINANCE_CODES.has(code);
  const status = e?.response?.status ?? e?.status;
  if (typeof status === 'number') return RETRYABLE_HTTP.has(status);
  // no readable status/body: network error, "Failed to fetch" TypeError, axios ERR_NETWORK, CORS
  return true;
}

/** Run one proxy call through the shared limiter: serialized, spaced, and retried with backoff
 *  on opaque/throttle failures. Rethrows after MAX_RETRIES or for non-retryable errors so the
 *  caller's own try/catch still isolates that section. */
export function runThrottled<T>(fn: () => Promise<T>, label = ''): Promise<T> {
  const run = async (): Promise<T> => {
    for (let attempt = 0; ; attempt++) {
      const wait = Math.max(0, lastRequestAt + MIN_GAP_MS - Date.now(), pauseUntil - Date.now());
      if (wait) await sleep(wait);
      lastRequestAt = Date.now();
      cycleCalls++;
      try {
        return await fn();
      } catch (e) {
        if (!isRetryable(e) || attempt >= MAX_RETRIES) throw e;
        const backoff = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempt) * (0.8 + 0.4 * Math.random());
        pauseUntil = Date.now() + backoff;
        cycleRetries++;
        console.warn(`binance proxy throttled${label ? ` (${label})` : ''} — backing off ${Math.round(backoff)}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
      }
    }
  };
  // enqueue after whatever is already running (regardless of its outcome), keeping the chain alive
  const result = chain.then(run, run);
  chain = result.catch(() => {});
  return result;
}

/** Reset + report the per-refresh counters. Call at the end of a load cycle to log how much
 *  throttling actually happened, so MIN_GAP_MS / HEAVY_INTERVAL_MS can be tuned from real data. */
export function flushThrottleStats(): { calls: number; retries: number } {
  const stats = { calls: cycleCalls, retries: cycleRetries };
  cycleCalls = 0;
  cycleRetries = 0;
  return stats;
}
