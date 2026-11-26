// components/dialogs/EditDialog.tsx — add / edit a manual asset (new look, old mechanics).
// Drives the real ColdWallet new-asset state (Props) + setUserData. Two add stages:
// pick currency → details; edit jumps straight to details.
import React, { useEffect, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import Props from '../Props';
import AssetDTO, { crypto, fiat } from '../../domain/AssetDTO';
import fiatCurrencies from '../../fiatCurrencies';
import uuidGenerator from '../../utils/uuidGenerator';
import {
  AMOUNT_ERROR_TEXT, MAX_ASSET_NAME_LENGTH, NAME_ERROR_TEXT, amountScale, isAmountInputAllowed,
  validateAmount, validateAssetName, type AmountError, type NameError,
} from '../../utils/amount';
import { assetColor } from '../../ui/visual';
import { CoinChip } from '../dashboard/AssetIcon';

const POPULAR = ['USD', 'EUR', 'UAH', 'USDT', 'BTC', 'ETH'];

export default function EditDialog({ props }: { props: Props }) {
  const editing = props.assetToEdit;
  const currency = editing ? editing.currency : props.newAssetCurrency;
  const stage: 'pick' | 'details' = currency ? 'details' : 'pick';
  const [q, setQ] = useState('');
  const [amountError, setAmountError] = useState<AmountError | null>(null);
  const [nameError, setNameError] = useState<NameError | null>(null);
  // Decimal places the amount may have: ISO minor units for fiat (EUR 2, JPY 0), exchange
  // precision for crypto. Drives both the input mask and the rounding on save.
  const scale = currency
    ? amountScale(currency, props.binanceCurrencies?.[currency]?.precision, editing?.decimalScale)
    : 8;

  // default the name when first entering the details stage for a brand-new asset
  useEffect(() => {
    if (!editing && currency && props.newAssetName == null) {
      props.setNewAssetName(currency + ' amount');
    }
    // eslint-disable-next-line
  }, [editing, currency]);

  function close() {
    props.stateReset();
  }
  function pick(code: string) {
    props.setNewAssetCurrency(code);
    props.setShowCreateNewAssetWindow(false);
    // warm up the price before the asset is even saved, so its USD value is ready
    props.prefetchPrice(code);
  }
  function back() {
    props.setNewAssetCurrency(null);
    props.setNewAssetName(null);
    props.setNewAssetAmount(null);
  }
  function save() {
    // Validate AND canonicalise: the stored amount is rounded to the currency's precision with
    // trailing zeros stripped, the name is trimmed — so "1,012.000…000" is saved as "1012".
    const amount = validateAmount(props.newAssetAmount, scale);
    const name = validateAssetName(props.newAssetName);
    setAmountError(amount.ok ? null : amount.error);
    setNameError(name.ok ? null : name.error);
    if (!amount.ok) props.setIsNewAssetAmountInvalid(true);
    if (!name.ok) props.setIsNewAssetNameInvalid(true);
    if (!amount.ok || !name.ok) return;

    const userDataNew = { ...props.userData };
    if (!userDataNew.assets) userDataNew.assets = [];
    if (editing) {
      userDataNew.assets = userDataNew.assets.map((a) =>
        a.id === editing.id
          ? new AssetDTO(editing.id, editing.currency, amount.value, name.value, scale, editing.type)
          : a);
    } else {
      const cur = currency as string;
      const fc = fiatCurrencies.getByStringCode(cur);
      const asset = new AssetDTO(uuidGenerator.generateUUID(), cur, amount.value, name.value, scale, fc ? fiat : crypto);
      userDataNew.assets = [asset, ...userDataNew.assets];
    }
    props.setUserData(userDataNew);
    props.stateReset();
  }

  const results = (props.currencyOptions || []).filter((o) => {
    if (!q) return false;
    return (o.value || '').toLowerCase().includes(q.toLowerCase());
  }).slice(0, 60);

  const cur = (currency || '') as string;
  const color = assetColor(cur);
  const isFiat = cur ? !!fiatCurrencies.getByStringCode(cur) : false;

  return (
    <div className="scrim" onClick={close}>
      <div className="dialog" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
        {stage === 'pick' ? (
          <>
            <h3>Add asset</h3>
            <div className="asset-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
              <input placeholder="Search all currencies & coins…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            </div>
            {q ? (
              <div className="asset-list">
                {results.map((o) => {
                  const c = assetColor(o.value);
                  return (
                    <div className="asset-li" key={o.value} onClick={() => pick(o.value)}>
                      <CoinChip className="asset-li__ico" code={o.value} color={c} />
                      <div className="asset-li__main">
                        <div className="asset-li__code">{o.value}</div>
                        <div className="asset-li__name">{o.label}</div>
                      </div>
                      <span className="asset-li__kind">{fiatCurrencies.getByStringCode(o.value) ? 'Fiat' : 'Crypto'}</span>
                    </div>
                  );
                })}
                {results.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No matches for “{q}”.</div>}
              </div>
            ) : (
              <>
                <div className="pop-label">Popular</div>
                <div className="asset-grid">
                  {POPULAR.map((a) => {
                    const c = assetColor(a);
                    return (
                      <div className="asset-card" key={a} onClick={() => pick(a)}>
                        <CoinChip className="asset-card__ico" code={a} color={c} />
                        <span className="asset-card__code">{a}</span>
                        <span className="asset-card__name">{fiatCurrencies.getByStringCode(a) ? 'Fiat' : 'Crypto'}</span>
                      </div>
                    );
                  })}
                </div>
                <button className="connect-cta" onClick={() => { props.stateReset(); props.setShowConfigsWindow(true); }}>
                  <span className="connect-cta__ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" /></svg>
                  </span>
                  <span className="connect-cta__main"><b>Connect an exchange or wallet</b><small>Auto-sync balances from Binance, OKX, MetaMask…</small></span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </>
            )}
            <div className="dialog__actions">
              <button className="btn" onClick={close}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <h3>{editing ? 'Edit holding' : 'New asset'}</h3>
            <div className="sel-chip">
              <CoinChip className="sel-chip__ico" code={cur} kind={isFiat ? 'fiat' : 'crypto'} color={color} />
              <div className="sel-chip__main">
                <div className="sel-chip__code">{cur} <span style={{ color: 'var(--ink-3)', fontWeight: 400, fontSize: 12 }}>· {isFiat ? 'fiat' : 'crypto'}</span></div>
                <div className="sel-chip__name">{props.newAssetName || cur + ' amount'}</div>
              </div>
              {!editing && <button className="sel-chip__change" onClick={back}>Change</button>}
            </div>
            <div className="field">
              <label>Amount</label>
              <NumericFormat
                allowNegative={false}
                allowLeadingZeros={false}
                valueIsNumericString
                thousandSeparator
                displayType="input"
                inputMode="decimal"
                decimalScale={scale}
                isAllowed={(v) => isAmountInputAllowed(v.value)}
                value={props.newAssetAmount ?? ''}
                placeholder={(scale ? '0.' + '0'.repeat(Math.min(scale, 2)) : '0') + ' ' + cur}
                className={props.isNewAssetAmountInvalid ? 'invalid' : ''}
                aria-invalid={!!amountError}
                autoFocus
                onValueChange={(v) => { props.setIsNewAssetAmountInvalid(false); setAmountError(null); props.setNewAssetAmount(v.value); }}
              />
              {amountError && <small className="hint hint--error" role="alert">{AMOUNT_ERROR_TEXT[amountError]}</small>}
            </div>
            <div className="field">
              <label>Name</label>
              <input
                value={props.newAssetName ?? ''}
                maxLength={MAX_ASSET_NAME_LENGTH}
                className={props.isNewAssetNameInvalid ? 'invalid' : ''}
                aria-invalid={!!nameError}
                onChange={(e) => { props.setIsNewAssetNameInvalid(false); setNameError(null); props.setNewAssetName(e.target.value); }}
                placeholder={cur + ' amount'}
              />
              {nameError
                ? <small className="hint hint--error" role="alert">{NAME_ERROR_TEXT[nameError]}</small>
                : <small className="hint">Shown as the label in your holdings list.</small>}
            </div>
            <div className="dialog__actions">
              <button className="btn" onClick={close}>Cancel</button>
              <button className="btn btn--p" onClick={save}>{editing ? 'Save' : 'Add asset'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
