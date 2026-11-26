import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { cryptoIconUrl, sourceIconUrl } from '../../ui/assetIcons';
import { CRYPTO_ICON_CODES, SOURCE_ICON_KEYS } from '../../ui/assetIcons.data';
import { fiatSymbol, fiatTint } from '../../ui/fiatGlyph';
import { CoinChip, SourceMark } from './AssetIcon';

// file lists via Vite's glob (node:fs is polyfilled away in this browser-targeted config)
const names = (g: Record<string, unknown>) => Object.keys(g).map((k) => k.split('/').pop()!).sort();

describe('asset icon lookup', () => {
  it('covers the coins the demo and common portfolios use', () => {
    for (const c of ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'DOT', 'DAI', 'BNB', 'XRP', 'XLM', 'ADA', 'XAUT', 'TRX', 'TON']) {
      expect(cryptoIconUrl(c)).toBe('/asset-icons/crypto/' + c.toLowerCase() + '.svg');
    }
    expect(cryptoIconUrl('usdt')).toBe('/asset-icons/crypto/usdt.svg');
  });

  it('returns null for unknown tickers so the text chip stays', () => {
    expect(cryptoIconUrl('NOPE123')).toBeNull();
    expect(cryptoIconUrl('')).toBeNull();
    expect(cryptoIconUrl(null)).toBeNull();
  });

  it('maps integrations and CCXT ids (incl. aliases) to brand marks', () => {
    expect(sourceIconUrl('binance')).toBe('/asset-icons/source/binance.svg');
    expect(sourceIconUrl('MetaMask')).toBe('/asset-icons/source/metamask.svg');
    expect(sourceIconUrl('monobank')).toBe('/asset-icons/source/monobank.svg');
    expect(sourceIconUrl('krakenfutures')).toBe('/asset-icons/source/kraken.svg');
    expect(sourceIconUrl('binanceusdm')).toBe('/asset-icons/source/binance.svg');
    expect(sourceIconUrl('htx')).toBe('/asset-icons/source/huobi.svg');
    expect(sourceIconUrl('someexchange')).toBeNull();
    expect(sourceIconUrl('manual')).toBeNull();
  });

  it('every listed code has a bundled file (and nothing else is bundled)', () => {
    const crypto = names(import.meta.glob('/public/asset-icons/crypto/*.svg'));
    expect(crypto).toEqual(CRYPTO_ICON_CODES.map((c) => c.toLowerCase() + '.svg').sort());
    const sources = names(import.meta.glob('/public/asset-icons/source/*.svg'));
    expect(sources).toEqual(SOURCE_ICON_KEYS.map((k) => k + '.svg').sort());
  });
});

describe('fiat symbols', () => {
  it('uses the currency sign, disambiguated where the sign is shared', () => {
    expect(fiatSymbol('UAH')).toBe('₴');
    expect(fiatSymbol('EUR')).toBe('€');
    expect(fiatSymbol('USD')).toBe('$');
    expect(fiatSymbol('GBP')).toBe('£');
    expect(fiatSymbol('PLN')).toBe('zł');
    expect(fiatSymbol('TRY')).toBe('₺');
    expect(fiatSymbol('CAD')).toBe('CA$');
    expect(fiatSymbol('XAU')).toBe('Au');
  });

  it('returns null when a currency has no sign (the code is shown)', () => {
    expect(fiatSymbol('CHF')).toBeNull();
    expect(fiatSymbol('KGS')).toBeNull();
  });

  it('gives majors their own tint and the rest one shared tile', () => {
    expect(fiatTint('USD')).not.toEqual(fiatTint('EUR'));
    expect(fiatTint('NOK')).toEqual(fiatTint('SEK'));
  });
});

describe('CoinChip / SourceMark', () => {
  it('draws a symbol tile for fiat', () => {
    const { container } = render(<CoinChip className="coin" code="UAH" kind="fiat" color="#fff" />);
    expect(container.querySelector('.fiat-glyph')?.textContent).toBe('₴');
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows the coin logo for known crypto and falls back to text if it fails to load', () => {
    const { container } = render(<CoinChip className="coin" code="BTC" kind="crypto" color="#f00" />);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/asset-icons/crypto/btc.svg');
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('BTC');
  });

  it('keeps the coloured ticker for unknown crypto', () => {
    const { container } = render(<CoinChip className="coin" code="NOPE123" kind="crypto" color="#f00" text="NOP" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('NOP');
  });

  it('keeps the $ letter for Cash / Manual', () => {
    const { container } = render(<SourceMark className="coin__src" icon={null} mark="$" tint="#8a94a6" />);
    expect(container.textContent).toBe('$');
  });
});
