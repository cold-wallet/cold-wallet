// components/dashboard/AssetIcon.tsx — the coin chip and source mark. Crypto: bundled coin logo. Fiat: a
// drawn tile with the currency symbol (₴ € £ …). Anything without an icon — or whose icon fails
// to load — keeps the original coloured ticker chip / tinted letter.
import React, { useEffect, useState } from 'react';
import { cryptoIconUrl, isRoundCryptoIcon } from '../../ui/assetIcons';
import { assetSym } from '../../ui/visual';
import { fiatSymbol, fiatTint } from '../../ui/fiatGlyph';
import fiatCurrencies from '../../fiatCurrencies';

function useIcon(url: string | null): [string | null, () => void] {
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => setFailed(null), [url]);
  return [url && failed !== url ? url : null, () => setFailed(url)];
}

interface CoinChipProps {
  code: string;
  kind?: 'fiat' | 'crypto';
  /** chip colour for the text fallback */
  color: string;
  className: string;
  /** text fallback (defaults to the trimmed ticker) */
  text?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/** Currency chip: fiat symbol tile, crypto logo, or the coloured ticker chip. `kind` comes
 *  from the asset; without it (currency pickers) the ISO 4217 list decides. */
export function CoinChip({ code, kind, color, className, text, style, children }: CoinChipProps) {
  const isFiat = kind ? kind === 'fiat' : !!(code && fiatCurrencies.getByStringCode(code.toUpperCase()));
  const [src, onError] = useIcon(isFiat ? null : cryptoIconUrl(code));
  if (isFiat) {
    const sym = fiatSymbol(code) || code.toUpperCase();
    const t = fiatTint(code);
    const len = Array.from(sym).length;
    return (
      <span
        className={className + ' fiat-glyph'}
        data-len={len > 3 ? 4 : len}
        style={{ background: `linear-gradient(145deg, ${t.from}, ${t.to})`, color: t.ink, ...style }}
      >
        <span className="fiat-glyph__sym">{sym}</span>
        {children}
      </span>
    );
  }
  if (src) {
    const img = <img className="asset-icon" src={src} alt="" draggable={false} decoding="async" onError={onError} />;
    return (
      <span className={className + ' has-icon'} style={style}>
        {/* Round logos sit in a clipping box and are scaled up so the circle fills the tile's
            corners; the clip is a child, so the chip itself can still let the source badge overhang. */}
        {isRoundCryptoIcon(code) ? <span className="asset-icon-clip">{img}</span> : img}
        {children}
      </span>
    );
  }
  return (
    <span className={className} style={{ background: color + '22', color, border: '1px solid ' + color + '55', ...style }}>
      {text ?? assetSym(code)}
      {children}
    </span>
  );
}

interface SourceMarkProps {
  icon: string | null;
  mark: string;
  tint: string;
  className: string;
  title?: string;
  style?: React.CSSProperties;
}

/** Integration mark: bundled brand icon, or the tinted letter (Cash / Manual keeps its "$"). */
export function SourceMark({ icon, mark, tint, className, title, style }: SourceMarkProps) {
  const [src, onError] = useIcon(icon);
  if (src) {
    return (
      <span className={className + ' has-icon'} title={title} style={style}>
        <img className="asset-icon" src={src} alt="" draggable={false} decoding="async" onError={onError} />
      </span>
    );
  }
  return <span className={className} title={title} style={{ background: tint, ...style }}>{mark}</span>;
}
