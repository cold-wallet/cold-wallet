// utils/amount.ts — one place for what a valid holding amount / name is and how it is stored.
// Amounts are kept as canonical decimal strings ("1012", "0.5", "1234.56"): rounded half-up to the
// currency's precision, no trailing zeros, no exponent. All arithmetic here is on digit strings /
// BigInt, never Number, so long values don't lose precision before they are even saved.
import fiatCurrencies from '../fiatCurrencies';
import noExponents from './noExponents';

/**
 * Largest integer part we accept: 30 digits (< 10^30). Cheap meme / spam tokens are held in
 * trillions and beyond (BabyDoge's supply is ~4.2·10^17), so a 15-digit cap was too tight. The
 * amount itself is stored as an exact string; only the USD value goes through Number(), where 30
 * digits cost a relative error of ~1e-16 — invisible. The cap only stops pasted junk.
 */
export const MAX_INTEGER_DIGITS = 30;
/** Upper bound for decimals (ERC-20 tokens go up to 18). */
export const MAX_SCALE = 18;
export const MAX_ASSET_NAME_LENGTH = 40;

const clampScale = (n: number) => Math.min(MAX_SCALE, Math.max(0, Math.floor(n)));

/**
 * Decimal places for a currency: ISO 4217 minor units for fiat (JPY 0, EUR 2, BHD 3; metals,
 * which have no minor unit in ISO, 8), else the exchange precision, else the stored scale, else 8.
 */
export function amountScale(
  currency: string,
  cryptoPrecision?: number | null,
  storedScale?: number | null,
): number {
  const fc = currency ? fiatCurrencies.getByStringCode(currency.toUpperCase()) : null;
  if (fc) return typeof fc.afterDecimalPoint === 'number' ? clampScale(fc.afterDecimalPoint) : 8;
  if (typeof cryptoPrecision === 'number' && isFinite(cryptoPrecision)) return clampScale(cryptoPrecision);
  if (typeof storedScale === 'number' && isFinite(storedScale)) return clampScale(storedScale);
  return 8;
}

export type AmountError = 'empty' | 'invalid' | 'zero' | 'too-large';
export type AmountResult = { ok: true; value: string } | { ok: false; error: AmountError };

/** Parse, round to `scale` and canonicalise an amount. Accepts "1,012.50", "1e-7", " 3 ". */
export function validateAmount(raw: string | number | null | undefined, scale: number = MAX_SCALE): AmountResult {
  if (raw === null || raw === undefined) return { ok: false, error: 'empty' };
  let s = String(raw).trim().replace(/,/g, '');
  if (!s) return { ok: false, error: 'empty' };
  if (/e/i.test(s)) s = String(noExponents(s));
  const m = /^(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m || (!m[1] && !m[2])) return { ok: false, error: 'invalid' };

  const sc = clampScale(scale);
  const intPart = m[1] || '0';
  const frac = m[2] || '';
  const keep = frac.slice(0, sc).padEnd(sc, '0');
  const roundUp = frac.length > sc && frac.charCodeAt(sc) >= 53; // next digit >= '5'
  const scaled = BigInt(intPart + keep) + (roundUp ? 1n : 0n);
  if (scaled === 0n) return { ok: false, error: 'zero' };

  const digits = scaled.toString().padStart(sc + 1, '0');
  const outInt = sc ? digits.slice(0, -sc) : digits;
  const outFrac = sc ? digits.slice(-sc).replace(/0+$/, '') : '';
  if (outInt.replace(/^0+/, '').length > MAX_INTEGER_DIGITS) return { ok: false, error: 'too-large' };
  return { ok: true, value: outFrac ? `${outInt}.${outFrac}` : outInt };
}

/** Canonical form or null; handy where an invalid value should just be left alone. */
export function normalizeAmount(raw: string | number | null | undefined, scale: number = MAX_SCALE): string | null {
  const r = validateAmount(raw, scale);
  return r.ok ? r.value : null;
}

/** Block an integer part longer than MAX_INTEGER_DIGITS (leading zeros don't count). */
export function isAmountInputAllowed(value: string): boolean {
  const intPart = (value || '').split('.')[0].replace(/^0+/, '');
  return intPart.length <= MAX_INTEGER_DIGITS;
}

export type AmountInputNotice = 'not-a-number' | 'two-dots' | 'no-decimals' | 'too-many-decimals' | 'too-large';
export type AmountInputResult = { value: string | null; notice: AmountInputNotice | null };

/**
 * Parse what was typed or pasted into the amount field. The field accepts only digits and one
 * "." as the decimal point. Any edit that would not leave a valid number is REJECTED as a whole
 * (`value: null`, the field keeps its value) with a notice, never "repaired": stripping characters
 * would silently change the amount ("1.5e-7" -> 1.57, "-100" -> 100, "1,5" -> 15). Rejected: any
 * other character (comma, space, letter, sign, currency symbol), a second dot, more decimals than
 * `scale` (or any when `scale` is 0), more than MAX_INTEGER_DIGITS before the point. Works on the
 * input value itself, not key events, so paste and phone keyboards behave the same.
 */
export function sanitizeAmountInput(raw: string, scale: number): AmountInputResult {
  const s = raw || '';
  if (/[^\d.]/.test(s)) return { value: null, notice: 'not-a-number' };
  if ((s.match(/\./g) || []).length > 1) return { value: null, notice: 'two-dots' };
  const sc = clampScale(scale);
  const dot = s.indexOf('.');
  let intPart = dot < 0 ? s : s.slice(0, dot);
  const frac = dot < 0 ? null : s.slice(dot + 1);
  if (frac !== null && sc === 0) return { value: null, notice: 'no-decimals' };
  if (frac !== null && frac.length > sc) return { value: null, notice: 'too-many-decimals' };
  intPart = intPart.replace(/^0+(?=\d)/, '');
  if (frac !== null && !intPart) intPart = '0';
  if (!isAmountInputAllowed(intPart)) return { value: null, notice: 'too-large' };
  return { value: frac === null ? intPart : `${intPart}.${frac}`, notice: null };
}

/**
 * `scale` is the limit in force; `currencyScale` the currency's own precision. They differ only
 * for a legacy holding that already stores more decimals (EditDialog keeps them), and then the
 * notice must not attribute the wider limit to the currency.
 */
export function amountInputNoticeText(notice: AmountInputNotice, currency: string, scale: number, currencyScale: number = scale): string {
  const decimals = (n: number) => `${n} decimal${n === 1 ? '' : 's'}`;
  switch (notice) {
    case 'not-a-number': return 'Only digits and a dot (.) are allowed.';
    case 'two-dots': return 'An amount has only one decimal point.';
    case 'no-decimals': return `${currency} has no decimals.`;
    case 'too-many-decimals': return scale > currencyScale
      ? `At most ${decimals(scale)} for this holding.`
      : `${currency} allows up to ${decimals(scale)}.`;
    case 'too-large': return `At most ${MAX_INTEGER_DIGITS} digits before the point.`;
  }
}

export type NameError = 'empty' | 'too-long';
export type NameResult = { ok: true; value: string } | { ok: false; error: NameError };

/** Trim, collapse runs of whitespace, and cap the length (counted in characters, not UTF-16 units). */
export function validateAssetName(raw: string | null | undefined): NameResult {
  const value = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!value) return { ok: false, error: 'empty' };
  if (Array.from(value).length > MAX_ASSET_NAME_LENGTH) return { ok: false, error: 'too-long' };
  return { ok: true, value };
}

/** Default label for a new holding: "<TICKER> amount", or just the ticker (cut to the name limit)
 *  when that would be too long — CoinGecko has 38-character tickers. */
export function defaultAssetName(currency: string): string {
  const full = `${currency} amount`;
  if (Array.from(full).length <= MAX_ASSET_NAME_LENGTH) return full;
  return Array.from(currency).slice(0, MAX_ASSET_NAME_LENGTH).join('');
}

export const AMOUNT_ERROR_TEXT: Record<AmountError, string> = {
  empty: 'Enter an amount.',
  invalid: 'Use digits and one decimal point.',
  zero: 'Amount must be greater than 0.',
  'too-large': `Amount is too large (max ${MAX_INTEGER_DIGITS} digits before the point).`,
};

export const NAME_ERROR_TEXT: Record<NameError, string> = {
  empty: 'Enter a name.',
  'too-long': `Keep it to ${MAX_ASSET_NAME_LENGTH} characters.`,
};
