import { assetSym, glyphWidth } from './visual';

describe('assetSym', () => {
  it('keeps short tickers as they are', () => {
    expect(assetSym('weth')).toBe('WETH');
    expect(assetSym('1INCH')).toBe('1IN');
  });
  it('builds the chip label from letters and digits of long / punctuated tickers', () => {
    expect(assetSym('1-COIN-CAN-CHANGE-YOUR-LIFE')).toBe('1CO');
    expect(assetSym('DOG•GO•TO•THE•MOON')).toBe('DOG');
    expect(assetSym('COLOREDBITCOIN (ARC20)')).toBe('COL');
    expect(assetSym('PIRATECOIN☠')).toBe('PIR');
    expect(assetSym('山野万里 你是我藏在微风里的欢喜')).toBe('山野万');
    expect(assetSym('( ͡° ͜ʖ ͡°)')).toBe('ʖ'); // the only letter; no stray combining marks
  });
  it('falls back to symbols, never splitting an astral character', () => {
    expect(assetSym('🐸🐸🐸🐸🐸')).toBe('🐸🐸🐸');
  });
});

describe('glyphWidth', () => {
  it('weights wide glyphs and ignores combining marks', () => {
    expect(glyphWidth('ETH')).toBe(3);
    expect(glyphWidth('山野万')).toBeCloseTo(4.8);
    expect(glyphWidth('( ͡')).toBe(2); // the combining ͡ takes no width
  });
});
