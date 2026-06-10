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

/** Split the trailing ".dd" of a formatted total for the muted-cents style. */
export function splitCents(str: string): [string, string] {
  const i = str.lastIndexOf('.');
  if (i < 0) return [str, ''];
  return [str.slice(0, i), str.slice(i)];
}
