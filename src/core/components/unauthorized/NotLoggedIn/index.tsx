// NotLoggedIn — first-run gate, reskinned to the new WelcomeView design.
// Create wallet (PIN first: nothing is stored until the PIN is chosen and confirmed) / demo mode /
// import-from-token + terms checkbox. Also shown over a locked wallet whose PIN was forgotten
// (`replacing`): a note says that creating or importing replaces it, with a way back to the PIN.
import React, { useRef, useState, type ReactNode } from "react";
import PinSetup from "../../pin/PinSetup";
import BackupImportDialog from "../../settings/ImportData/BackupImportDialog";
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

export default function NotLoggedIn({ props, replacing }: {
    props: Props,
    /** a locked wallet is on this device; `onBack` returns to its PIN screen */
    replacing?: { onBack: () => void },
}) {
    const accepted = props.termsAndPolicyAgreed;
    const [choosingPin, setChoosingPin] = useState(false);
    // A click on an option that needs the terms points at the checkbox: the row shakes (unless the
    // system asks for less motion), the box is highlighted until ticked, and it takes the focus.
    const [pointed, setPointed] = useState(false);
    const terms = useRef<HTMLLabelElement>(null);
    const termsBox = useRef<HTMLInputElement>(null);
    function pointAtTerms() {
        setPointed(true);
        termsBox.current?.focus({ preventScroll: true });
        terms.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        terms.current?.animate?.(
            [0, -7, 6, -4, 3, 0].map((x) => ({ transform: `translateX(${x}px)` })),
            { duration: 380, easing: 'ease-out' },
        );
    }

    function createWallet() {
        if (accepted) setChoosingPin(true);
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
        return <WelcomeImport props={props} replacing={!!replacing} />;
    }
    if (choosingPin) {
        return <PinSetup title="Create new wallet"
                         intro={replacing
                             ? "First, choose a PIN for the new wallet. The locked wallet is replaced once you confirm it."
                             : "First, choose a PIN. It locks your wallet on this device."}
                         onBack={() => setChoosingPin(false)}
                         onDone={props.createWallet} />;
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

                {replacing && (
                    <div className="welcome__replace" role="note">
                        A locked wallet is on this device. Creating or importing a wallet replaces it for good.{' '}
                        <button className="welcome__back" onClick={replacing.onBack}>Back to unlock</button>
                    </div>
                )}

                <div className="welcome__opts">
                    {/* aria-disabled, not disabled: a disabled button gets no click to point at the terms with */}
                    {OPTIONS.map((o) => (
                        <button key={o.key} className={"wopt" + (o.primary ? " wopt--p" : "")}
                                aria-disabled={o.disabled || undefined}
                                aria-describedby={o.disabled ? 'wterms-txt' : undefined}
                                onClick={o.disabled ? pointAtTerms : o.onClick}>
                            <span className="wopt__ico">{o.icon}</span>
                            <span className="wopt__txt">
                                <span className="wopt__title">{o.title}</span>
                                <span className="wopt__desc">{o.desc}</span>
                            </span>
                            <svg className="wopt__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                        </button>
                    ))}
                </div>

                <label ref={terms} className={"wterms" + (pointed && !accepted ? " wterms--pointed" : "")}>
                    <input ref={termsBox} type="checkbox" checked={accepted} onChange={(e) => props.setTermsAndPolicyAgreed(e.target.checked)} />
                    <span className="wterms__box" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 6" /></svg>
                    </span>
                    <span className="wterms__txt" id="wterms-txt">
                        I have read and accept the <a href="/terms">Terms of Use</a> and <a href="/privacy-policy">Privacy Policy</a>
                    </span>
                </label>
            </div>
        </div>
    );
}

function WelcomeImport({ props, replacing }: { props: Props, replacing: boolean }) {
    // Same flow as Settings → Import: the token (and its PIN, if it has one) is decrypted and
    // validated before anything is replaced; a rejected token keeps the dialog open with the reason.
    return <BackupImportDialog props={props}
                               title="Import wallet"
                               intro={replacing
                                   ? "Paste a token exported from Cold Wallet and enter its PIN. It replaces the locked wallet once both check out."
                                   : "Paste a backup token exported from Cold Wallet to restore your portfolio."}
                               submitLabel="Import"
                               onCancel={() => props.stateReset()}
                               onImported={() => {
                                   props.stateReset();
                                   props.setShowCreateNewAssetWindow(false);
                                   props.setCreatingNewAsset(false);
                               }} />;
}
