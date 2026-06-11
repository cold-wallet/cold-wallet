// redesign/format.ts — lightweight USD formatter for chart/labels.
import noExponents from '../../utils/noExponents';

export function fmtUSD(v: number, opts: { cents?: boolean } = {}): string {
  const n = isFinite(v) ? v : 0;
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: opts.cents === false ? 0 : 2,
    maximumFractionDigits: opts.cents === false ? 0 : 2,
  });
}

/** Fixed mask shown in place of any amount/USD value when the privacy toggle is on.
 *  Representation only — never persisted, never fed back into data or calculations. */
export const AMOUNT_MASK = '*****';

/** USD value, or the fixed mask when hidden. Use at render sites only. */
export function maskUSD(v: number, hidden: boolean, opts: { cents?: boolean } = {}): string {
  return hidden ? AMOUNT_MASK : fmtUSD(v, opts);
}

/** Native-amount display value + decimals to feed NumericFormat.
 *  Normally the amount rounds (half-up) to `scale` decimals. But when that would make a
 *  non-zero amount show as all-zeros (dust, e.g. 0.0011 USDC at 2 decimals), fall back to
 *  ONE significant figure — TRUNCATED, never rounded up (only in this case):
 *    0.0011212 -> 0.001, 0.0000453 -> 0.00004, 0.000479 -> 0.0004. */
export function amountDisplay(rawAmount: string, scale: number): { value: string; decimalScale: number } {
  const value = String(noExponents(rawAmount));
  const n = Number(value);
  if (!isFinite(n) || n === 0 || Number(n.toFixed(scale)) !== 0) {
    return { value, decimalScale: scale };
  }
  // rounds to zero at `scale` → show the first significant figure, truncated
  const neg = value.trim().startsWith('-');
  const s = neg ? value.trim().slice(1) : value.trim();
  const frac = s.includes('.') ? s.slice(s.indexOf('.') + 1) : '';
  let i = 0;
  while (i < frac.length && frac[i] === '0') i++;
  if (i >= frac.length) return { value, decimalScale: scale };
  const decimals = i + 1;
  return { value: (neg ? '-' : '') + '0.' + frac.slice(0, decimals), decimalScale: decimals };
}

/** Split the trailing ".dd" of a formatted total for the muted-cents style. */
export function splitCents(str: string): [string, string] {
  const i = str.lastIndexOf('.');
  if (i < 0) return [str, ''];
  return [str.slice(0, i), str.slice(i)];
}
