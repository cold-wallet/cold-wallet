import {
  MAX_ASSET_NAME_LENGTH, amountScale, isAmountInputAllowed, normalizeAmount, validateAmount, validateAssetName,
} from './amount';

describe('validateAmount', () => {
  it('strips trailing zeros (the long "1012.000…" case)', () => {
    expect(validateAmount('1012.0000000000000000000', 2)).toEqual({ ok: true, value: '1012' });
    expect(validateAmount('1012.0000000000000000000123', 2)).toEqual({ ok: true, value: '1012' });
    expect(validateAmount('1012.50', 2)).toEqual({ ok: true, value: '1012.5' });
  });

  it('rounds half-up to the currency scale, carrying into the integer part', () => {
    expect(normalizeAmount('1.005', 2)).toBe('1.01');
    expect(normalizeAmount('1.004', 2)).toBe('1');
    expect(normalizeAmount('9.999', 2)).toBe('10');
    expect(normalizeAmount('1234.5', 0)).toBe('1235'); // JPY
    expect(normalizeAmount('0.123456789', 8)).toBe('0.12345679');
  });

  it('accepts thousands separators, spaces and exponents', () => {
    expect(normalizeAmount(' 1,234,567.89 ', 2)).toBe('1234567.89');
    expect(normalizeAmount('1e-7', 8)).toBe('0.0000001');
    expect(normalizeAmount('2.5E3', 2)).toBe('2500');
    expect(normalizeAmount(42, 2)).toBe('42');
    expect(normalizeAmount('.5', 2)).toBe('0.5');
    expect(normalizeAmount('007', 2)).toBe('7');
  });

  it('keeps precision Number() would lose', () => {
    expect(normalizeAmount('123456789012345.123456789', 9)).toBe('123456789012345.123456789');
  });

  it('rejects empty, junk, zero, negative and too-large values with a reason', () => {
    expect(validateAmount('', 2)).toEqual({ ok: false, error: 'empty' });
    expect(validateAmount(null, 2)).toEqual({ ok: false, error: 'empty' });
    expect(validateAmount('   ', 2)).toEqual({ ok: false, error: 'empty' });
    expect(validateAmount('abc', 2)).toEqual({ ok: false, error: 'invalid' });
    expect(validateAmount('1.2.3', 2)).toEqual({ ok: false, error: 'invalid' });
    expect(validateAmount('-5', 2)).toEqual({ ok: false, error: 'invalid' });
    expect(validateAmount('.', 2)).toEqual({ ok: false, error: 'invalid' });
    expect(validateAmount('0', 2)).toEqual({ ok: false, error: 'zero' });
    expect(validateAmount('0.004', 2)).toEqual({ ok: false, error: 'zero' }); // rounds to 0
    expect(validateAmount('1000000000000000', 2)).toEqual({ ok: false, error: 'too-large' });
    expect(validateAmount('999999999999999.999', 2)).toEqual({ ok: false, error: 'too-large' }); // rounds up past the cap
    expect(validateAmount('999999999999999', 2)).toEqual({ ok: true, value: '999999999999999' });
  });
});

describe('isAmountInputAllowed', () => {
  it('caps the integer part while typing, ignoring leading zeros', () => {
    expect(isAmountInputAllowed('123456789012345')).toBe(true);
    expect(isAmountInputAllowed('1234567890123456')).toBe(false);
    expect(isAmountInputAllowed('000123.45')).toBe(true);
    expect(isAmountInputAllowed('')).toBe(true);
  });
});

describe('amountScale', () => {
  it('uses ISO minor units for fiat, incl. 0 and metals', () => {
    expect(amountScale('EUR')).toBe(2);
    expect(amountScale('jpy')).toBe(0);
    expect(amountScale('XAU')).toBe(8); // no ISO minor unit
  });
  it('uses exchange precision, then the stored scale, then 8 for crypto', () => {
    expect(amountScale('BTC', 6, 8)).toBe(6);
    expect(amountScale('BTC', null, 5)).toBe(5);
    expect(amountScale('NEWCOIN')).toBe(8);
    expect(amountScale('NEWCOIN', 40)).toBe(18); // clamped
  });
});

describe('validateAssetName', () => {
  it('trims and collapses whitespace', () => {
    expect(validateAssetName('  EUR   jar  monobank ')).toEqual({ ok: true, value: 'EUR jar monobank' });
  });
  it('rejects whitespace-only and empty names', () => {
    expect(validateAssetName('   ')).toEqual({ ok: false, error: 'empty' });
    expect(validateAssetName(null)).toEqual({ ok: false, error: 'empty' });
  });
  it('counts characters, not UTF-16 units', () => {
    expect(validateAssetName('🙂'.repeat(MAX_ASSET_NAME_LENGTH)).ok).toBe(true);
    expect(validateAssetName('🙂'.repeat(MAX_ASSET_NAME_LENGTH + 1))).toEqual({ ok: false, error: 'too-long' });
  });
});
