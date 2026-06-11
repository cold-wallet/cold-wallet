// redesign/SettingsDialog.tsx — settings modal (new look, real mechanics).
// Routes the same Props sub-state the legacy SettingsWindow used:
//   integrationWindowNameSelected → IntegrationConfig (real *Settings field bindings + validation)
//   importOrExportSettingRequested → Export / Import (dataImporter)
//   pinCodeSettingsRequested / deletePinCodeRequested → PinView (PinCodeSetting state machine)
//   else → default view (Integrations · Data · Security)
import React, { useState } from "react";
import Props from "../Props";
import { onSaveSetting } from "../settings/IntegrationSettings";
import { dataImporter } from "../settings/ImportData";
import ccxtConnector from "../../integrations/ccxt/ccxtConnector";
import PinPad, { PIN_MAX, PIN_MIN } from "./PinPad";

const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" clipRule="evenodd" style={{ width: 15, height: 15 }}><path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.3 7.3 0 0 0-1.69-.98l-.38-2.65A.49.49 0 0 0 14.13 2h-4a.49.49 0 0 0-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65c-.04.32-.07.66-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.14.24.42.32.61.22l2.49-1c.52.39 1.08.73 1.69.98l.38 2.65c.04.24.25.42.49.42h4c.24 0 .45-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.19.1.47.02.61-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" /></svg>
);
const Back = ({ onClick }: { onClick: () => void }) => (
  <button className="backbtn" onClick={onClick}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 6l-6 6 6 6" /></svg>
    Back
  </button>
);

const PARTNERS = [
  { key: 'binance', name: 'Binance', mark: 'B', tint: '#e0a82e' },
  { key: 'okx', name: 'OKX', mark: 'X', tint: '#c9ccd1' },
  { key: 'monobank', name: 'Monobank', mark: 'm', tint: '#b6bcc6' },
  { key: 'metamask', name: 'MetaMask', mark: 'M', tint: '#e2761b' },
];

export default function SettingsDialog({ props }: { props: Props }) {
  const close = () => props.stateReset();

  let body: React.ReactNode;
  if (props.integrationWindowNameSelected) {
    body = <IntegrationConfig props={props} name={props.integrationWindowNameSelected} />;
  } else if (props.importOrExportSettingRequested === 'export') {
    body = <ExportView props={props} />;
  } else if (props.importOrExportSettingRequested === 'import') {
    body = <ImportView props={props} />;
  } else if (props.pinCodeSettingsRequested || props.deletePinCodeRequested) {
    body = <PinView props={props} />;
  } else {
    body = <DefaultView props={props} />;
  }

  return (
    <div className="scrim" onClick={close}>
      <div className="dialog dialog--lg" onClick={(e) => e.stopPropagation()}>
        <div className="dlg__head">
          <h3>
            <span className="brand__mark" style={{ width: 28, height: 28, borderRadius: 8 }}><GearIcon /></span>
            Settings
          </h3>
          <button className="iconbtn" title="Close" onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {body}
      </div>
    </div>
  );
}

// The switch reflects the TEMPORARY (pending) state, not what's persisted, so an
// unsaved toggle shows immediately and is reverted on Cancel/Back/close.
function integrationEnabled(props: Props, key: string): boolean {
  switch (key) {
    case 'binance': return props.binanceSettingsEnabled;
    case 'okx': return props.okxSettingsEnabled;
    case 'monobank': return props.monobankSettingsEnabled;
    case 'metamask': return props.metaMaskSettingsEnabled;
    default: return props.enabledCcxtIntegrations.has(key);
  }
}

function statusNote(props: Props, key: string, on: boolean): string {
  if (!on) return 'Not connected';
  switch (key) {
    case 'binance':
    case 'okx': return 'API key · read-only';
    case 'monobank': return 'Token';
    case 'metamask': {
      const acc = props.userData.settings.metaMask?.accounts;
      const addr = acc ? Object.keys(acc)[0] : null;
      return addr ? addr.slice(0, 6) + '…' + addr.slice(-4) : 'Connected';
    }
    default: return 'API key';
  }
}

// Enable/disable is a PENDING change — it sets only the temporary state, never
// userData. It is committed solely by a validated Save (onSaveSetting); Cancel /
// Back / closing settings reverts it (revertIntegrationTemp / stateReset).
function toggleIntegration(props: Props, key: string, on: boolean): void {
  const next = !on;
  switch (key) {
    case 'binance': props.setBinanceSettingsEnabled(next); break;
    case 'okx': props.setOkxSettingsEnabled(next); break;
    case 'monobank': props.setMonobankSettingsEnabled(next); break;
    case 'metamask':
      if (next) props.metaMaskHandleConnect().then(() => props.setMetaMaskSettingsEnabled(true));
      else props.setMetaMaskSettingsEnabled(false);
      break;
    default: {
      const set = new Set(props.enabledCcxtIntegrations);
      next ? set.add(key) : set.delete(key);
      props.setEnabledCcxtIntegrations(set);
    }
  }
}

/** Discard this integration's pending inputs + toggle, restoring the persisted values. */
function revertIntegrationTemp(props: Props, name: string): void {
  const s = props.userData.settings;
  switch (name) {
    case 'binance':
      props.setBinanceSettingsEnabled(s.binanceIntegrationEnabled);
      props.setBinanceApiKeyInput(s.binanceIntegrationApiKey);
      props.setBinanceApiSecretInput(s.binanceIntegrationApiSecret);
      props.setBinanceApiKeysInputInvalid(false);
      break;
    case 'okx':
      props.setOkxSettingsEnabled(s.okxIntegrationEnabled);
      props.setOkxApiKeyInput(s.okxIntegrationApiKey);
      props.setOkxApiSecretInput(s.okxIntegrationApiSecret);
      props.setOkxApiPassPhraseInput(s.okxIntegrationPassPhrase);
      props.setOkxApiSubAccountNameInput(s.okxIntegrationSubAccountName);
      props.setOkxApiKeysInputInvalid(false);
      break;
    case 'monobank':
      props.setMonobankSettingsEnabled(s.monobankIntegrationEnabled);
      props.setMonobankApiTokenInput(s.monobankIntegrationToken);
      props.setMonobankApiTokenInputInvalid(false);
      break;
    case 'metamask':
      props.setMetaMaskSettingsEnabled(!!(s.metaMask && s.metaMask.enabled));
      break;
    default: {
      const enabled = !!(s.integrations && s.integrations[name] && s.integrations[name].enabled);
      const set = new Set(props.enabledCcxtIntegrations);
      enabled ? set.add(name) : set.delete(name);
      props.setEnabledCcxtIntegrations(set);
      props.setCurrentIntegrationApiKey(null);
      props.setCurrentIntegrationApiSecret(null);
      props.setCurrentIntegrationApiPassword(null);
      props.setCurrentIntegrationApiAdditionalSetting(null);
      props.setCurrentSettingInputsInvalid(false);
    }
  }
}

function DefaultView({ props }: { props: Props }) {
  const ccxtKeys = Array.from(new Set([
    ...Object.keys(props.userData.settings.integrations || {}),
    ...Array.from(props.enabledCcxtIntegrations),
  ])).filter((k) => !PARTNERS.some((p) => p.key === k));

  const rows = [
    ...PARTNERS,
    ...ccxtKeys.map((k) => ({ key: k, name: k.charAt(0).toUpperCase() + k.slice(1), mark: (k[0] || 'C').toUpperCase(), tint: '#9aa7b8' })),
  ];

  const hasPin = !!props.userData.settings.pinCode;

  return (
    <div className="dlg__body">
      <div className="sect">
        <div className="sect__label">Integrations <span className="muted">third-party sources</span></div>
        <div className="intg-grid">
          {rows.map((r) => {
            const on = integrationEnabled(props, r.key);
            return (
              <div className={"intg cfg" + (on ? " on" : "")} key={r.key} onClick={() => props.setIntegrationWindowNameSelected(r.key)}>
                <div className="intg__chip" style={{ background: r.tint }}>{r.mark}</div>
                <div className="intg__main">
                  <div className="intg__name">{r.name}</div>
                  <div className={"intg__status" + (on ? " live" : "")}>
                    {on && <span className="ldot" />}{statusNote(props, r.key, on)}
                  </div>
                </div>
                <button className={"switch" + (on ? " on" : "")} title={on ? 'Disconnect' : 'Connect'}
                  onClick={(e) => { e.stopPropagation(); toggleIntegration(props, r.key, on); }} />
                <span className="intg__chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg></span>
              </div>
            );
          })}
        </div>
        <div className="addintg">
          <CcxtAddSelect props={props} taken={rows.map((r) => r.key)} />
        </div>
      </div>

      <div className="sect">
        <div className="sect__label">Data</div>
        <div className="duo">
          <button className="optbtn" onClick={() => props.setImportOrExportSettingRequested('export')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12M8 11l4 4 4-4M4 21h16" /></svg>
            <span>Export<small>Backup token</small></span>
          </button>
          <button className="optbtn" onClick={() => props.setImportOrExportSettingRequested('import')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15V3M8 7l4-4 4 4M4 21h16" /></svg>
            <span>Import<small>Restore from token</small></span>
          </button>
        </div>
      </div>

      <div className="sect">
        <div className="sect__label">Security</div>
        <button className="optbtn" style={{ marginBottom: 10 }} onClick={() => props.setPinCodeSettingsRequested(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          <span>{hasPin ? 'Change' : 'Add'} PIN-code<small>Lock the app with a 4–8 digit code</small></span>
        </button>
        {hasPin && (
          <button className="optbtn" style={{ marginBottom: 10 }} onClick={() => props.setDeletePinCodeRequested(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
            <span>Delete PIN-code<small>Remove the app lock</small></span>
          </button>
        )}
        <div className="duo">
          <button className="optbtn soon" disabled><span>Pass-phrase</span><span className="soontag">Soon</span></button>
          <button className="optbtn soon" disabled><span>Two-factor auth</span><span className="soontag">Soon</span></button>
        </div>
      </div>
    </div>
  );
}

function CcxtAddSelect({ props, taken }: { props: Props; taken: string[] }) {
  // ccxt exchange list is large; lazy-require to avoid eager work.
  const [options] = useState<string[]>(() => {
    try {
      return (ccxtConnector.getExchanges() as string[]).filter((e) => !taken.includes(e));
    } catch { return []; }
  });
  return (
    <select value="" onChange={(e) => e.target.value && props.setIntegrationWindowNameSelected(e.target.value)}>
      <option value="">+ Add exchange integration…</option>
      {options.map((e) => <option key={e} value={e}>{e}</option>)}
    </select>
  );
}

interface FieldBinding {
  id: string;
  label: string;
  secret?: boolean;
  defaultValue: string;
  setValue: (v: string) => void;
  invalid: boolean;
  setInvalid: (b: boolean) => void;
}

function IntegrationConfig({ props, name }: { props: Props; name: string }) {
  // Cancel / Back discard the pending inputs + toggle (revert to persisted) and
  // return to the list — nothing is saved unless Save passes validation.
  const cancel = () => { revertIntegrationTemp(props, name); props.setIntegrationWindowNameSelected(null); };
  const s = props.userData.settings;
  const isMM = name === 'metamask';

  const enabled = integrationEnabled(props, name); // shared temporary (pending) state
  const [shown, setShown] = useState<Record<string, boolean>>({});

  let fields: FieldBinding[] = [];
  if (name === 'binance') {
    fields = [
      { id: 'key', label: 'binance API key', defaultValue: s.binanceIntegrationApiKey || '', setValue: props.setBinanceApiKeyInput, invalid: props.binanceApiKeysInputInvalid, setInvalid: props.setBinanceApiKeysInputInvalid },
      { id: 'secret', label: 'binance API secret', secret: true, defaultValue: s.binanceIntegrationApiSecret || '', setValue: props.setBinanceApiSecretInput, invalid: props.binanceApiKeysInputInvalid, setInvalid: props.setBinanceApiKeysInputInvalid },
    ];
  } else if (name === 'okx') {
    fields = [
      { id: 'key', label: 'OKX API key', defaultValue: s.okxIntegrationApiKey || '', setValue: props.setOkxApiKeyInput, invalid: props.okxApiKeysInputInvalid, setInvalid: props.setOkxApiKeysInputInvalid },
      { id: 'secret', label: 'OKX API secret', secret: true, defaultValue: s.okxIntegrationApiSecret || '', setValue: props.setOkxApiSecretInput, invalid: props.okxApiKeysInputInvalid, setInvalid: props.setOkxApiKeysInputInvalid },
      { id: 'pass', label: 'OKX API pass-phrase', secret: true, defaultValue: s.okxIntegrationPassPhrase || '', setValue: props.setOkxApiPassPhraseInput, invalid: props.okxApiKeysInputInvalid, setInvalid: props.setOkxApiKeysInputInvalid },
      { id: 'sub', label: 'OKX API sub-account name', defaultValue: s.okxIntegrationSubAccountName || '', setValue: props.setOkxApiSubAccountNameInput, invalid: props.okxApiKeysInputInvalid, setInvalid: props.setOkxApiKeysInputInvalid },
    ];
  } else if (name === 'monobank') {
    fields = [
      { id: 'token', label: 'monobank API token', secret: true, defaultValue: s.monobankIntegrationToken || '', setValue: props.setMonobankApiTokenInput, invalid: props.monobankApiTokenInputInvalid, setInvalid: props.setMonobankApiTokenInputInvalid },
    ];
  } else if (!isMM) {
    // generic ccxt exchange
    const cfg = (s.integrations && s.integrations[name]) || undefined;
    fields = [
      { id: 'key', label: name + ' API key', defaultValue: (cfg && cfg.apiKey) || '', setValue: props.setCurrentIntegrationApiKey, invalid: props.currentSettingInputsInvalid, setInvalid: props.setCurrentSettingInputsInvalid },
      { id: 'secret', label: name + ' API secret', secret: true, defaultValue: (cfg && cfg.apiSecret) || '', setValue: props.setCurrentIntegrationApiSecret, invalid: props.currentSettingInputsInvalid, setInvalid: props.setCurrentSettingInputsInvalid },
    ];
  }

  const partner = PARTNERS.find((p) => p.key === name);
  const title = partner ? partner.name : name;
  const tint = partner ? partner.tint : '#9aa7b8';
  const mark = partner ? partner.mark : (name[0] || 'C').toUpperCase();
  const mmAddr = s.metaMask && s.metaMask.accounts ? Object.keys(s.metaMask.accounts)[0] : null;

  return (
    <div className="dlg__body">
      <div className="cfg-head">
        <Back onClick={cancel} />
        <div className="cfg-title">
          <span className="intg__chip" style={{ background: tint }}>{mark}</span>
          <b>{title}</b>
        </div>
      </div>

      <div className="enable-row">
        <button className={"switch" + (enabled ? " on" : "")} onClick={() => toggleIntegration(props, name, enabled)} />
        <div className="enable-row__txt">
          <b>Enable {title} integration</b>
          <small>Sync balances automatically from {title}</small>
        </div>
      </div>

      <div className={"cfg-fields" + (enabled ? "" : " off")}>
        {isMM ? (
          <>
            {!props.metaMaskHasProvider && (
              <div className="notice">
                <div className="notice__ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                </div>
                <div>
                  <b>MetaMask not detected</b>
                  <p>Install the MetaMask browser extension to connect your wallet automatically.</p>
                  <a className="installbtn" href="https://metamask.io" target="_blank" rel="noreferrer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 3v12M8 11l4 4 4-4M4 21h16" /></svg>
                    Install MetaMask
                  </a>
                </div>
              </div>
            )}
            {mmAddr && (
              <div className="wallet-card">
                <div className="wallet-card__main">
                  <div className="wallet-card__label">Connected wallet</div>
                  <div className="wallet-card__addr"><code title={mmAddr}>{mmAddr.slice(0, 14)}…{mmAddr.slice(-6)}</code></div>
                </div>
                <span className="intg__status live" style={{ alignSelf: 'flex-start' }}><span className="ldot" />Linked</span>
              </div>
            )}
            {props.metaMaskIsConnecting && <progress style={{ width: '100%' }} />}
            {props.metaMaskIsError && <div className="import-err" style={{ marginTop: 10 }}>{props.metaMaskErrorMessage}</div>}
            <div className="cfg-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
              Read-only access. We never request transaction permissions or your seed phrase.
            </div>
          </>
        ) : (
          <>
            {fields.map((f) => (
              <div className="field" key={f.id}>
                <label>{f.label}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={f.secret && !shown[f.id] ? 'password' : 'text'}
                    disabled={!enabled}
                    defaultValue={f.defaultValue}
                    placeholder={f.label}
                    className={f.invalid ? 'invalid' : ''}
                    style={{ paddingRight: f.secret ? 44 : 12 }}
                    onChange={(e) => { f.setValue(e.target.value); f.setInvalid(false); }}
                  />
                  {f.secret && (
                    <button onClick={() => setShown((sh) => ({ ...sh, [f.id]: !sh[f.id] }))} title={shown[f.id] ? 'Hide' : 'Show'}
                      style={{ position: 'absolute', right: 6, top: 6, width: 30, height: 28, border: 0, background: 'none', color: 'var(--ink-3)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                        {shown[f.id] ? <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /> : <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM1 1l22 22" />}
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(props.binanceUserDataLoading || props.okxUserDataLoading || props.monobankUserDataLoading || props.loadingUserDataFromResource === name) && <progress style={{ width: '100%' }} />}
            <div className="cfg-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
              Use read-only keys. Keys are encrypted and stored locally on this device.
            </div>
          </>
        )}
      </div>

      <div className="cfg-foot">
        <button className="btn" onClick={cancel}>Cancel</button>
        <button className="btn btn--p" onClick={() => onSaveSetting(props, () => props.stateReset())}>Save</button>
      </div>
    </div>
  );
}

function ExportView({ props }: { props: Props }) {
  const token = dataImporter.generateExportData(props.userDataHolder);
  const [copied, setCopied] = useState(false);
  function copy() {
    try { navigator.clipboard.writeText(token); } catch { /* unavailable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <div className="dlg__body">
      <div className="cfg-head">
        <Back onClick={() => props.setImportOrExportSettingRequested(null)} />
        <div className="cfg-title"><b>Export backup</b></div>
      </div>
      <p className="data-desc">This token is an encrypted backup of all your holdings and integration settings. Store it somewhere safe — anyone with this token can restore your portfolio.</p>
      <div className="token-box"><code>{token}</code></div>
      <div className="data-actbar">
        <button className={"ghostbtn" + (copied ? " copied" : "")} onClick={copy}>
          {copied
            ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l5 5L20 6" /></svg>Copied</>
            : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>Copy token</>}
        </button>
        <span className="meta num">{token.length.toLocaleString()} characters</span>
      </div>
      <div className="cfg-foot">
        <button className="btn btn--p" onClick={() => props.setImportOrExportSettingRequested(null)} style={{ flex: 'none', padding: '0 28px' }}>Done</button>
      </div>
    </div>
  );
}

function ImportView({ props }: { props: Props }) {
  const [text, setText] = useState('');
  const valid = text.trim().length > 8;
  function doImport() {
    if (props.importDataBuffer) {
      dataImporter.readImportedData(props.importDataBuffer, props.setUserDataHolder);
      props.loadBinanceUserData();
      props.loadMonobankUserData();
      props.loadOkxUserData();
      props.stateReset();
    }
  }
  return (
    <div className="dlg__body">
      <div className="cfg-head">
        <Back onClick={() => props.setImportOrExportSettingRequested(null)} />
        <div className="cfg-title"><b>Import backup</b></div>
      </div>
      <p className="data-desc">Paste a backup token exported from Cold Wallet to restore your portfolio. This replaces your current holdings.</p>
      <textarea className={"import-area" + (text && !valid ? " bad" : "")} placeholder="Paste your backup token here…"
        value={text} onChange={(e) => { setText(e.target.value); props.setImportDataBuffer(e.target.value); }} />
      <div className="cfg-foot">
        <button className="btn" onClick={() => props.setImportOrExportSettingRequested(null)}>Cancel</button>
        <button className="btn btn--p" disabled={!valid} onClick={doImport}>Restore</button>
      </div>
    </div>
  );
}

function PinView({ props }: { props: Props }) {
  const entering = props.pinCodeEnteringFinished;
  const pinCode = entering ? props.pinCodeRepeatEntered : props.pinCodeEntered;
  const setPinCode = entering ? props.setPinCodeRepeatEntered : props.setPinCodeEntered;
  const needCurrent = !!props.userData.settings.pinCode && (!props.currentPinCodeConfirmed || props.deletePinCodeRequested);

  function acceptPinCode() {
    if (!(pinCode && pinCode.length >= PIN_MIN && pinCode.length <= PIN_MAX)) return;
    if (props.pinCodeEnteringFinished) {
      if (props.pinCodeRepeatEntered === props.pinCodeEntered) {
        const newUserData = { ...props.userData };
        newUserData.settings.pinCode = pinCode;
        props.setUserData(newUserData);
        props.setPinCode(pinCode);
        props.setPinCodeEntered(null);
        props.setPinCodeRepeatEntered(null);
        props.setPinCodeEnteringFinished(false);
        props.setPinCodeSettingsRequested(false);
        props.setCurrentPinCodeConfirmed(false);
      } else {
        props.setInvalidPinCode(true);
        props.setPinCodeEntered(null);
        props.setPinCodeRepeatEntered(null);
        props.setPinCodeEnteringFinished(false);
      }
    } else if (needCurrent) {
      if (pinCode === props.userData.settings.pinCode) {
        if (props.deletePinCodeRequested) {
          const newUserData = { ...props.userData };
          newUserData.settings.pinCode = null;
          props.setUserData(newUserData);
          props.setPinCode(null);
          props.setPinCodeEntered(null);
          props.setPinCodeRepeatEntered(null);
          props.setPinCodeEnteringFinished(false);
          props.setPinCodeSettingsRequested(false);
          props.setCurrentPinCodeConfirmed(false);
          props.setInvalidPinCode(false);
          props.setDeletePinCodeRequested(false);
        } else if (!props.currentPinCodeConfirmed) {
          props.setCurrentPinCodeConfirmed(true);
          props.setPinCodeEntered(null);
          props.setInvalidPinCode(false);
        }
      } else {
        props.setInvalidPinCode(true);
        props.setPinCodeEntered(null);
      }
    } else {
      props.setInvalidPinCode(false);
      props.setPinCodeEnteringFinished(true);
    }
  }

  const back = () => {
    props.setPinCodeEntered(null);
    props.setInvalidPinCode(false);
    props.setPinCodeRepeatEntered(null);
    props.setPinCodeEnteringFinished(false);
    props.setPinCodeSettingsRequested(false);
    props.setCurrentPinCodeConfirmed(false);
    props.setDeletePinCodeRequested(false);
  };

  const prompt = props.pinCodeEnteringFinished ? 'Repeat new'
    : needCurrent ? (props.deletePinCodeRequested ? 'Enter current PIN to delete' : 'Enter current')
      : 'Enter 4–8 digit new';

  return (
    <div className="dlg__body">
      <div className="cfg-head">
        <Back onClick={back} />
        <div className="cfg-title">
          <span className="intg__chip" style={{ background: 'var(--accent)', width: 32, height: 32, borderRadius: 9, color: 'var(--accent-ink)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          </span>
          <b>{props.deletePinCodeRequested ? 'Delete' : props.userData.settings.pinCode ? 'Change' : 'Set'} PIN-code</b>
        </div>
      </div>
      <p className="data-desc" style={{ textAlign: 'center', color: props.invalidPinCode ? 'var(--danger)' : undefined }}>
        {props.invalidPinCode ? 'PIN-code does not match. ' : ''}{prompt} PIN-code.
      </p>
      <PinPad pinCode={pinCode} setPinCode={setPinCode} acceptPinCode={acceptPinCode} />
    </div>
  );
}
