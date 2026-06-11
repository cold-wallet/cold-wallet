// redesign/HoldingRow.tsx — one holding in the sidebar list (new design .row/.coin).
// Manual holdings get edit/delete; integration (synced) holdings get a lock.
import React from 'react';
import { NumericFormat } from 'react-number-format';
import noExponents from '../../utils/noExponents';
import { fmtUSD } from './format';
import { shortenAddresses } from './visual';
import type { Valued } from './portfolio';

interface HoldingRowProps {
  h: Valued;
  active: boolean;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function HoldingRow({ h, active, onSelect, onEdit, onDelete }: HoldingRowProps) {
  const a = h.asset;
  return (
    <div
      className={'row' + (active ? ' is-active' : '')}
      onClick={() => onSelect(h.id)}
      title={a.normalizedName}
    >
      <div className="coin" style={{ background: h.color + '22', color: h.color, border: '1px solid ' + h.color + '55' }}>
        {h.sym}
        <span className="coin__src" style={{ background: h.source.tint }}>{h.source.mark}</span>
      </div>
      <div className="row__main">
        <div className="row__top">
          <span className="row__asset">{h.code}</span>
          <span className="tag">{h.kind}</span>
        </div>
        <div className="row__sub">{shortenAddresses(a.normalizedName)}</div>
      </div>
      <div className="row__right">
        <div className="row__usd num">{fmtUSD(h.usd)}</div>
        <div className="row__amt num">
          <NumericFormat
            displayType="text"
            thousandSeparator
            valueIsNumericString
            decimalScale={a.decimalScale || 8}
            value={noExponents(a.amount)}
          /> {h.code}
        </div>
      </div>
      <div className="row__actions">
        {h.manual ? (
          <>
            <button className="act" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
            </button>
            <button className="act del" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
            </button>
          </>
        ) : (
          <span className="act lock" title={'Synced from ' + h.source.label + " — managed automatically"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          </span>
        )}
      </div>
    </div>
  );
}
