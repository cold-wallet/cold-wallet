// components/dashboard/HoldingRow.tsx — one holding in the sidebar list (new design .row/.coin).
// Manual holdings get edit/delete; integration (synced) holdings get a lock, plus a
// targeted refresh button when the source can load part of an account (Binance, OKX, MetaMask).
import React from 'react';
import RefreshButton from './RefreshButton';
import type { ButtonView } from '../../refresh/describe';
import { maskUSD, amountDisplay } from '../../ui/format';
import AmountText from './AmountText';
import PendingValue from './PendingValue';
import { shortenAddresses } from '../../ui/visual';
import { CoinChip, SourceMark } from './AssetIcon';
import type { Valued } from '../../ui/portfolio';

interface HoldingRowProps {
  h: Valued;
  hidden: boolean;
  active: boolean;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  /** this holding's refresh button (none: its source loads everything at once) */
  refresh?: { view: (now: number) => ButtonView; onClick: () => void };
}

export default function HoldingRow({ h, hidden, active, onSelect, onEdit, onDelete, refresh }: HoldingRowProps) {
  const a = h.asset;
  const amt = amountDisplay(a.amount, h.scale, h.unitUsd);
  // a holding being refreshed (or failing) keeps its buttons visible, not only on hover
  const view = refresh?.view(Date.now());
  const busy = !!view && (view.spinning || view.tone !== 'idle');
  return (
    <div
      className={'row' + (active ? ' is-active' : '') + (busy ? ' row--busy' : '')}
      onClick={() => onSelect(h.id)}
      title={a.normalizedName}
    >
      <CoinChip className="coin" code={h.code} kind={h.kind} color={h.color} text={h.sym}>
        <SourceMark className="coin__src" icon={h.source.icon} mark={h.source.mark} tint={h.source.tint} title={h.source.label} />
      </CoinChip>
      <div className="row__main">
        <div className="row__top">
          <span className="row__asset">{h.code}</span>
          <span className="tag">{h.kind}</span>
        </div>
        <div className="row__sub">{shortenAddresses(a.normalizedName)}</div>
      </div>
      <div className="row__end">
      <div className="row__right">
        {/* The holding in its own currency comes first, its USD equivalent under it. The classes
            stay by position (row__usd = the bold top line, row__amt = the muted second line) so
            each line keeps its look; only the content swapped. */}
        <div className="row__usd num">
          <AmountText amt={amt} code={h.code} hidden={hidden} />
        </div>
        {/* never "$0.00" for a holding whose price isn't known: that would read as worthless */}
        {h.priced
          ? <div className="row__amt num">{maskUSD(h.usd, hidden)}</div>
          : h.pending
            ? <div className="row__amt"><PendingValue /></div>
            : <div className="row__amt row__amt--noprice">no price</div>}
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
          <>
            {refresh ? (
              <RefreshButton className="act refresh" label={'Refresh ' + h.code} view={refresh.view} onClick={refresh.onClick} />
            ) : (
              /* spacer in the edit slot so the lock lines up with the delete button */
              <span className="act" aria-hidden="true" style={{ visibility: 'hidden' }} />
            )}
            <span className="act lock" title={'Synced from ' + h.source.label + " — managed automatically"}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
            </span>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
