// redesign/format.ts — lightweight USD formatter for chart/labels.
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

/** Split the trailing ".dd" of a formatted total for the muted-cents style. */
export function splitCents(str: string): [string, string] {
  const i = str.lastIndexOf('.');
  if (i < 0) return [str, ''];
  return [str.slice(0, i), str.slice(i)];
}
