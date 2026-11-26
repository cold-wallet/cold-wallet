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

  it('accepts meme-coin sized holdings (trillions and beyond) exactly', () => {
    expect(normalizeAmount('4200000000000000000', 8)).toBe('4200000000000000000'); // BabyDoge-scale supply
    expect(normalizeAmount('123456789012345678901234567.5', 8)).toBe('123456789012345678901234567.5');
    expect(normalizeAmount('999999999999999999999999999999', 0)).toBe('999999999999999999999999999999'); // 30 digits
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
    expect(validateAmount('1' + '0'.repeat(30), 2)).toEqual({ ok: false, error: 'too-large' }); // 31 digits
    expect(validateAmount('9'.repeat(30) + '.999', 2)).toEqual({ ok: false, error: 'too-large' }); // rounds up past the cap
    expect(validateAmount('9'.repeat(200), 2)).toEqual({ ok: false, error: 'too-large' }); // pasted junk
  });
});

describe('isAmountInputAllowed', () => {
  it('caps the integer part while typing, ignoring leading zeros', () => {
    expect(isAmountInputAllowed('9'.repeat(30))).toBe(true);
    expect(isAmountInputAllowed('9'.repeat(31))).toBe(false);
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

describe('defaultAssetName', () => {
  it('uses "<TICKER> amount" when it fits and the ticker alone (cut) when it does not', async () => {
    const { defaultAssetName } = await import('./amount');
    expect(defaultAssetName('EUR')).toBe('EUR amount');
    const long = 'HIXOKDKEKJCJDKSICNDNAIAIHSBZNNXNXNDUJE'; // a real 38-char CoinGecko ticker
    expect(defaultAssetName(long)).toBe(long);
    expect(validateAssetName(defaultAssetName(long)).ok).toBe(true);
    expect(Array.from(defaultAssetName('X'.repeat(60))).length).toBe(MAX_ASSET_NAME_LENGTH);
  });
});

describe('sanitizeAmountInput', () => {
  const run = async (raw: string, scale: number) => (await import('./amount')).sanitizeAmountInput(raw, scale);

  it('accepts plain typing with a dot', async () => {
    expect(await run('1.5', 8)).toEqual({ value: '1.5', notice: null });
    expect(await run('12.', 2)).toEqual({ value: '12.', notice: null });   // trailing dot while typing
    expect(await run('.', 2)).toEqual({ value: '0.', notice: null });      // dot first
    expect(await run('.5', 2)).toEqual({ value: '0.5', notice: null });
    expect(await run('007', 2)).toEqual({ value: '7', notice: null });
    expect(await run('', 2)).toEqual({ value: '', notice: null });
  });

  it('never treats a comma as a decimal: drops it and says so', async () => {
    expect(await run('1,5', 8)).toEqual({ value: '15', notice: 'comma' });
    expect(await run('1,234.56', 2)).toEqual({ value: '1234.56', notice: 'comma' }); // US paste
    expect(await run('1,000', 8)).toEqual({ value: '1000', notice: 'comma' });
  });

  it('rejects letters, exponents and signs instead of silently dropping them', async () => {
    const NAN = { value: null, notice: 'not-a-number' };
    expect(await run('1.5e-7', 8)).toEqual(NAN);   // would otherwise read as 1.57
    expect(await run('2E3', 2)).toEqual(NAN);      // would otherwise read as 23
    expect(await run('1.5k', 2)).toEqual(NAN);     // would otherwise read as 1.5
    expect(await run('2M', 2)).toEqual(NAN);
    expect(await run('-100', 2)).toEqual(NAN);     // would otherwise lose the sign
    expect(await run('\u22125', 2)).toEqual(NAN);   // Unicode minus
    expect(await run('\u20135', 2)).toEqual(NAN);   // en dash pasted from text
    expect(await run('+5', 2)).toEqual(NAN);
    expect(await run('0.25 BTC', 8)).toEqual(NAN); // a ticker is letters too
  });

  it('still drops currency symbols and grouping silently', async () => {
    expect(await run('$1234.56', 2)).toEqual({ value: '1234.56', notice: null });
    expect(await run('\u20ac 12.5', 2)).toEqual({ value: '12.5', notice: null });
  });

  it('rejects a second dot wherever it is typed, so the point never moves', async () => {
    expect(await run('1.2.34', 2)).toEqual({ value: null, notice: 'two-dots' });   // 12.34, dot between 1 and 2
    expect(await run('12.3.4', 2)).toEqual({ value: null, notice: 'two-dots' });   // 12.34, dot between 3 and 4
    expect(await run('.12.34', 2)).toEqual({ value: null, notice: 'two-dots' });   // dot at the very start
    expect(await run('12.34.', 2)).toEqual({ value: null, notice: 'two-dots' });   // dot at the end
    expect(await run('1..', 2)).toEqual({ value: null, notice: 'two-dots' });      // two in a row
    expect(await run('1.234.567', 2)).toEqual({ value: null, notice: 'two-dots' }); // EU thousands paste
  });

  it('rejects more decimals than the currency has instead of dropping digits', async () => {
    expect(await run('1.923', 2)).toEqual({ value: null, notice: 'too-many-decimals' }); // 1.23, 9 after the dot
    expect(await run('1.234', 2)).toEqual({ value: null, notice: 'too-many-decimals' });
    expect(await run('12.', 0)).toEqual({ value: null, notice: 'no-decimals' });          // JPY
    expect(await run('1.12345678', 8)).toEqual({ value: '1.12345678', notice: null });
  });

  it('drops grouping spaces / apostrophes and junk silently', async () => {
    expect(await run('1 234.5', 2)).toEqual({ value: '1234.5', notice: null });
    expect(await run("1'234", 2)).toEqual({ value: '1234', notice: null });
    expect(await run('1\u00A0234', 2)).toEqual({ value: '1234', notice: null });
  });

  it('rejects a change that would exceed the digit cap', async () => {
    expect(await run('9'.repeat(30), 2)).toEqual({ value: '9'.repeat(30), notice: null });
    expect(await run('9'.repeat(31), 2)).toEqual({ value: null, notice: 'too-large' });
  });
});

describe('amountInputNoticeText', () => {
  it("names the currency's limit, but not for a legacy holding with more decimals", async () => {
    const { amountInputNoticeText } = await import('./amount');
    expect(amountInputNoticeText('too-many-decimals', 'EUR', 2, 2)).toBe('EUR allows up to 2 decimals.');
    expect(amountInputNoticeText('too-many-decimals', 'EUR', 4, 2)).toBe('At most 4 decimals for this holding.');
    expect(amountInputNoticeText('too-many-decimals', 'BTC', 1)).toBe('BTC allows up to 1 decimal.');
  });
});
