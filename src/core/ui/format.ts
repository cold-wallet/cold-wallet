// redesign/format.ts — lightweight USD formatter for chart/labels.
import noExponents from '../../utils/noExponents';

export function fmtUSD(v: number, opts: { cents?: boolean } = {}): string {
  const n = isFinite(v) ? v : 0;
  const digits = opts.cents === false ? 0 : 2;
  // A positive value too small to be worth a cent would format as "$0.00"/"$0" — show the
  // "<$0.01" floor instead so dust never looks like nothing. (Guard on rounds-to-zero too,
  // so a whole-dollar "$0" for e.g. $0.40 isn't mislabelled as sub-cent.)
  if (n > 0 && n < 0.01 && Math.round(n * Math.pow(10, digits)) === 0) {
    return '<$0.01';
  }
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Fixed mask shown in place of any amount/USD value when the privacy toggle is on.
 *  Representation only — never persisted, never fed back into data or calculations. */
export const AMOUNT_MASK = '*****';

/** USD value, or the fixed mask when hidden. Use at render sites only. */
export function maskUSD(v: number, hidden: boolean, opts: { cents?: boolean } = {}): string {
  return hidden ? AMOUNT_MASK : fmtUSD(v, opts);
}

export interface AmountParts { value: string; decimalScale: number; floor?: boolean; }

// The smallest 2-decimal amount step we'd ever render, weighed against the sub-cent USD floor.
const AMOUNT_STEP = 0.01;
const SUBCENT_USD = 0.01;

/** Native-amount display value + decimals to feed NumericFormat.
 *  Normally the amount rounds (half-up) to `scale` decimals. When that would make a non-zero
 *  amount show as all-zeros (dust, e.g. 0.0011 USDC at 2 decimals):
 *   - if the coin is so cheap that 0.01 of it is worth < 1¢ (`unitUsd` known and < $1), the exact
 *     digits carry no value and only widen the row — collapse to the "<0.01" floor (mirrors the
 *     "<$0.01" USD floor; `floor:true` tells the caller to render the literal, not via NumericFormat);
 *   - otherwise fall back to ONE significant figure, TRUNCATED, never rounded up:
 *     0.0011212 -> 0.001, 0.0000453 -> 0.00004, 0.000479 -> 0.0004.
 *  Pricier coins never collapse: 0.01 ETH is real money, so its dust keeps real digits. */
export function amountDisplay(rawAmount: string, scale: number, unitUsd?: number): AmountParts {
  const value = String(noExponents(rawAmount));
  const n = Number(value);
  if (!isFinite(n) || n === 0 || Number(n.toFixed(scale)) !== 0) {
    return { value, decimalScale: scale };
  }
  // rounds to zero at `scale` → this is dust. Cheap-coin dust collapses to the "<0.01" floor.
  if (unitUsd !== undefined && isFinite(unitUsd) && unitUsd > 0
      && AMOUNT_STEP * unitUsd < SUBCENT_USD && Math.abs(n) < AMOUNT_STEP) {
    return { value: '<0.01', decimalScale: 0, floor: true };
  }
  // otherwise show the first significant figure, truncated
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
