// NotLoggedIn — first-run gate, reskinned to the new WelcomeView design.
// Same mechanics: create wallet / demo mode / import-from-token + terms checkbox.
import React, { useState, type ReactNode } from "react";
import UserData from "../../../domain/UserData";
import uuidGenerator from "../../../utils/uuidGenerator";
import { initUserDataHolder } from "../../../services/UserDataService";
import { dataImporter } from "../../settings/ImportData";
import Props from "../../Props";

interface Option {
    key: string;
    primary?: boolean;
    disabled?: boolean;
    onClick: () => void;
    title: string;
    desc: string;
    icon: ReactNode;
}

export default function NotLoggedIn(props: Props) {
    const accepted = props.termsAndPolicyAgreed;

    function createWallet() {
        if (accepted) {
            props.setUserDataHolder(initUserDataHolder(new UserData(uuidGenerator.generateUUID())));
        }
    }
    function enableDemo() {
        // Full navigation to /demo so the app remounts with the demo's in-memory storage
        // factories — the demo session reads/writes nothing in localStorage. The demo holder
        // itself is built by the /demo effect in ColdWallet.
        window.location.assign('/demo');
    }
    function startImport() {
        if (accepted) props.setImportOrExportSettingRequested('import');
    }

    if (props.importOrExportSettingRequested === 'import') {
        return <WelcomeImport props={props} />;
    }

    const OPTIONS: Option[] = [
        {
            key: 'create', primary: true, disabled: !accepted, onClick: createWallet,
            title: 'Create new wallet', desc: 'Start fresh and add your first asset',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>,
        },
        {
            key: 'demo', onClick: enableDemo,
            title: 'Try the demo', desc: 'Explore the dashboard with sample holdings',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 5v14l11-7z" /></svg>,
        },
        {
            key: 'import', disabled: !accepted, onClick: startImport,
            title: 'Import wallet', desc: 'Restore from a backup token',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12M8 11l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>,
        },
    ];

    return (
        <div className="welcome">
            <div className="welcome__card">
                <div className="welcome__brand">
                    <div className="welcome__mark">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
                    </div>
                    <div className="welcome__name">Cold Wallet</div>
                    <div className="welcome__tag">Your private, self-custodied portfolio</div>
                </div>

                <div className="welcome__opts">
                    {OPTIONS.map((o) => (
                        <button key={o.key} className={"wopt" + (o.primary ? " wopt--p" : "")} disabled={o.disabled} onClick={o.onClick}>
                            <span className="wopt__ico">{o.icon}</span>
                            <span className="wopt__txt">
                                <span className="wopt__title">{o.title}</span>
                                <span className="wopt__desc">{o.desc}</span>
                            </span>
                            <svg className="wopt__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                        </button>
                    ))}
                </div>

                <label className="wterms">
                    <input type="checkbox" checked={accepted} onChange={(e) => props.setTermsAndPolicyAgreed(e.target.checked)} />
                    <span className="wterms__box" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 6" /></svg>
                    </span>
                    <span className="wterms__txt">
                        I have read and accept the <a href="/terms">Terms of Use</a> and <a href="/privacy-policy">Privacy Policy</a>
                    </span>
                </label>
            </div>
        </div>
    );
}

function WelcomeImport({ props }: { props: Props }) {
    const [text, setText] = useState('');
    const valid = text.trim().length > 8;

    async function paste() {
        try {
            const t = await navigator.clipboard.readText();
            if (t) { setText(t); props.setImportDataBuffer(t); }
        } catch { /* clipboard unavailable */ }
    }
    function doImport() {
        if (props.importDataBuffer) {
            dataImporter.readImportedData(props.importDataBuffer, props.setUserDataHolder);
            props.loadBinanceUserData();
            props.loadMonobankUserData();
            props.loadOkxUserData();
        }
        props.stateReset();
        props.setShowCreateNewAssetWindow(false);
        props.setCreatingNewAsset(false);
    }

    return (
        <div className="scrim" onClick={() => props.stateReset()}>
            <div className="dialog" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
                <h3>Import wallet</h3>
                <p className="data-desc">Paste a backup token exported from Cold Wallet to restore your portfolio.</p>
                <textarea
                    className={"import-area" + (text && !valid ? " bad" : "")}
                    placeholder="Paste your backup token here…"
                    value={text}
                    onChange={(e) => { setText(e.target.value); props.setImportDataBuffer(e.target.value); }}
                    autoFocus
                />
                <div className="data-actbar">
                    <button className="ghostbtn" onClick={paste}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
                        Paste
                    </button>
                    <span className="meta num">{text.trim().length.toLocaleString()} characters</span>
                </div>
                <div className="dialog__actions">
                    <button className="btn" onClick={() => props.stateReset()}>Cancel</button>
                    <button className="btn btn--p" disabled={!valid} onClick={doImport}>Import</button>
                </div>
            </div>
        </div>
    );
}
