// components/dialogs/ConfirmDelete.tsx — delete-confirm modal (new look, old delete mechanics).
import React from 'react';
import Props from '../Props';
import { AssetType } from '../../domain/AssetDTO';
import { maskUSD, amountDisplay } from '../../ui/format';
import AmountText from '../dashboard/AmountText';
import { displayScale, unitUsdOf } from '../../ui/portfolio';
import { assetColor } from '../../ui/visual';
import { CoinChip } from '../dashboard/AssetIcon';

export default function ConfirmDelete({ props }: { props: Props }) {
  const a = props.assetToDelete!;
  const color = assetColor(a.currency);
  const usd = props.priceService.transform(a.currency, +a.amount, 'USD');
  const amt = amountDisplay(a.amount, displayScale(a, props.priceService), unitUsdOf(a, props.priceService));
  const hidden = props.hideAmounts;

  function cancel() {
    props.stateReset();
  }
  function confirm() {
    const userDataNew = { ...props.userData };
    userDataNew.assets = userDataNew.assets.filter((x) => x.id !== a.id);
    props.setUserData(userDataNew);
    props.stateReset();
    const anyAssetExist = props.getAnyAssetExist(userDataNew, props.binanceUserData, props.okxUserData, props.monobankUserData, props.ccxtUserData);
    if (!anyAssetExist) {
      props.setCreatingNewAsset(true);
      props.setShowCreateNewAssetWindow(true);
    }
  }

  return (
    <div className="scrim" onClick={cancel}>
      <div className="dialog confirm" style={{ width: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="confirm__ico">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" /></svg>
        </div>
        <h3>Delete asset?</h3>
        <p className="confirm__text">This removes <b style={{ color: 'var(--ink)' }}>{a.normalizedName}</b> from your portfolio. This can't be undone.</p>
        <div className="confirm__asset">
          <CoinChip className="del-ico" code={a.currency} kind={a.type === AssetType.fiat ? 'fiat' : 'crypto'} color={color}
                    style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 600, flex: 'none' }} />
          <span className="num">
            <AmountText amt={amt} code={a.currency} hidden={hidden} />
          </span>
          <span style={{ color: 'var(--ink-3)' }}>·</span>
          <span className="num" style={{ color: 'var(--ink-2)' }}>{maskUSD(usd, hidden)}</span>
        </div>
        <div className="dialog__actions">
          <button className="btn" onClick={cancel}>Cancel</button>
          <button className="btn btn--danger" onClick={confirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
