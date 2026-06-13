import './index.css';
import React, { useEffect, useRef, useState } from 'react';

// ---- outbound links & token facts (wired per the design handoff) ----
const CONTRACT = '0xa9995a928EbFa3030B86Ab62e85007e1AB7eb208';
const CONTRACT_SHORT = '0xa999…eb208';
const SUSHI = 'https://www.sushi.com/ethereum/swap?token0=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&token1=0xa9995a928EbFa3030B86Ab62e85007e1AB7eb208';
const CMC_DEX = 'https://dex.coinmarketcap.com/token/ethereum/0xa9995a928ebfa3030b86ab62e85007e1ab7eb208/';
const GITHUB = 'https://github.com/cold-wallet/cold-wallet';
const WHITEPAPER = '/whitepaper.pdf';
const DEMO = '/demo';
const TERMS = '/terms';
const PRIVACY = '/privacy-policy';

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

// ---- icons ----
const IconArrowUpRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
);
const IconChart = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l5-5 4 4 8-9" /></svg>
);
const IconArrowRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
);
const IconPlay = () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);
const IconLock = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
const IconCopy = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
);
const IconGithub = () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49l-.01-1.9c-2.78.62-3.37-1.2-3.37-1.2-.46-1.17-1.11-1.48-1.11-1.48-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.36 1.11 2.94.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.71 1.03 1.62 1.03 2.74 0 3.92-2.34 4.78-4.57 5.04.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" /></svg>
);
const IconX = () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.594l-5.165-6.753L5.34 22H2.08l8.02-9.166L1.5 2h6.76l4.668 6.17L18.244 2Zm-1.16 18h1.83L7.01 3.9H5.06l12.024 16.1Z" /></svg>
);
const IconTelegram = () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.94 4.6 18.66 20c-.24 1.08-.9 1.34-1.82.84l-5-3.68-2.42 2.32c-.27.27-.49.5-1 .5l.36-5.07L18 6.3c.4-.36-.09-.56-.62-.2L7.3 13.07 2.36 11.5c-1.07-.34-1.1-1.07.22-1.58L20.55 3.1c.9-.33 1.68.2 1.39 1.5Z" /></svg>
);

// ---- copy-to-clipboard contract button (flashes accent on success) ----
function CopyButton() {
    const [ok, setOk] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    function copy() {
        navigator.clipboard?.writeText(CONTRACT).catch(() => { /* clipboard unavailable */ });
        setOk(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setOk(false), 1400);
    }
    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
    return (
        <button className={'copy' + (ok ? ' ok' : '')} onClick={copy}
                title="Copy contract address" aria-label="Copy contract address">
            <IconCopy />
        </button>
    );
}

type Feature = { n: string; title: string; body: string; icon: React.ReactNode };
const FEATURES: Feature[] = [
    {
        n: '01', title: 'Anonymous by design',
        body: 'No account, no email, no KYC. We never see your IP address, your balances, or your history. Nothing to leak, nothing to subpoena.',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" /><path d="m9 12 2 2 4-4" /></svg>,
    },
    {
        n: '02', title: 'Every asset, one view',
        body: 'Fiat and crypto across banks, exchanges, wallets and cash — unified into a single balance you can actually read.',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M8 15h3" /></svg>,
    },
    {
        n: '03', title: 'See where it all sits',
        body: 'Live allocation in donut, bars and treemap. Spot your concentration and exposure across assets and sources at a glance.',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M12 3v9l6.5-6.5" /></svg>,
    },
    {
        n: '04', title: 'Your data stays yours',
        body: 'Local-first and self-custodied. Export an encrypted backup, restore it anywhere, and lock the app behind a PIN.',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>,
    },
    {
        n: '05', title: 'Live market sync',
        body: 'Real-time prices keep every holding, chart and percentage current to the second — no manual refresh, no stale numbers.',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l3 8 4-16 3 8h4" /></svg>,
    },
    {
        n: '06', title: 'Connect what you use',
        body: 'MetaMask, Binance, OKX, Monobank or manual entries. Plug in your sources in seconds and watch them merge into one portfolio.',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7H6a3 3 0 0 0 0 6h3" /><path d="M15 7h3a3 3 0 0 1 0 6h-3" /><path d="M8 10h8" /></svg>,
    },
];

type Util = { title: string; body: string; icon: React.ReactNode };
const TRUST: Util[] = [
    {
        title: 'Reads, never moves',
        body: "Integrations only pull balances. Cold Wallet can't send, swap, or spend a single thing.",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>,
    },
    {
        title: 'Read-only API keys',
        body: "Everything's already local and encrypted — but if you want even more peace of mind, connect with read-only keys. It's just your balances, and all we ever do is read them.",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /><path d="M12 15v2" /></svg>,
    },
    {
        title: 'Encrypted on your device',
        body: "Your data stays local and encrypted at rest. Lose the laptop and your portfolio still can't be read — there's nothing to steal there, either.",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15.5" r="1.4" /></svg>,
    },
    {
        title: 'Open source',
        body: 'Every line is public on GitHub. Audit it, fork it, or run your own copy — trust the code, not our word.',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 6-6 6 6 6" /><path d="m16 6 6 6-6 6" /></svg>,
    },
];

const CWT_UTILS: Util[] = [
    {
        title: 'Unlock Pro',
        body: 'Advanced charts, balance-history graphs so you can see how your wealth evolved over time, unlimited sources and priority market sync for CWT holders.',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 2.4 6.9H21l-5.3 4 2 6.8L12 16l-5.7 3.7 2-6.8L3 8.9h6.6z" /></svg>,
    },
    {
        title: 'Reduced swap fees',
        body: 'Pay less on in-app swaps and on/off-ramps when you transact in CWT.',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>,
    },
    {
        title: 'Governance',
        body: 'Vote on the roadmap, new integrations and protocol parameters.',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7z" /></svg>,
    },
    {
        title: 'Holder rewards',
        body: 'Earn for holding and actively using the wallet across the ecosystem.',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9 11h6" /></svg>,
    },
];

function UtilRow({ title, body, icon }: Util) {
    return (
        <div className="util">
            <div className="util__ico">{icon}</div>
            <div><b>{title}</b><span>{body}</span></div>
        </div>
    );
}

export default function Landing() {
    const rootRef = useRef<HTMLDivElement>(null);

    // Reveal-on-scroll, disabled under prefers-reduced-motion (CSS already shows final state there).
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const els = Array.from(root.querySelectorAll('.reveal'));
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    return (
        <div className="landing" ref={rootRef}>
            {/* ===== NAV ===== */}
            <header className="nav">
                <div className="wrap nav__in">
                    <a className="brand" href="#top">
                        <img className="brand__mark" src="/cold-wallet.svg" alt="Cold Wallet" />
                        <span className="brand__name">Cold Wallet</span>
                    </a>
                    <nav className="nav__links">
                        <a href="#why">Why Cold Wallet</a>
                        <a href="#cwt">CWT Token</a>
                        <a href={WHITEPAPER} {...ext}>Whitepaper</a>
                    </nav>
                    <div className="nav__cta">
                        <span className="nav__pill"><span className="live" /> CWT live on Ethereum</span>
                        <a className="btn btn--sm btn--p" href={SUSHI} {...ext}>Buy CWT</a>
                    </div>
                </div>
            </header>

            <span id="top" />

            {/* ===== HERO ===== */}
            <section className="hero">
                <div className="wrap hero__grid">
                    <div className="hero__copy">
                        <p className="eyebrow"><span className="dot">●</span> CWT · Ethereum · DEX-traded</p>
                        <h1>All your money.<br /><span className="g">One cold,<br />private view.</span></h1>
                        <p className="hero__sub">The anonymous portfolio dashboard for everything you own — fiat and crypto, every source, on one screen. No sign-up. No tracking. Powered by the CWT utility token.</p>
                        <div className="hero__cta">
                            <a className="btn btn--p" href={SUSHI} {...ext}><IconArrowUpRight /> Buy on SushiSwap</a>
                            <a className="btn" href={CMC_DEX} {...ext}><IconChart /> Watch CWT on CoinMarketCap DEX</a>
                        </div>
                        <div className="hero__meta">
                            <a className="linkarrow" href={WHITEPAPER} {...ext}>Read the whitepaper <IconArrowRight /></a>
                            <a className="linkarrow" href={DEMO} style={{ color: 'var(--ink-2)' }}>Try the live demo <IconArrowRight /></a>
                        </div>
                    </div>

                    <div className="shot reveal">
                        <div className="shot__glow" />
                        <div className="window">
                            <div className="window__bar">
                                <div className="window__dots"><i /><i /><i /></div>
                                <span className="window__url"><IconLock /> cold-wallet.app</span>
                            </div>
                            <img src="/hero-demo.png" alt="Cold Wallet portfolio dashboard" loading="eager" />
                        </div>
                        <a className="btn btn--sm btn--p shot__try" href={DEMO}><IconPlay /> Try the demo</a>
                    </div>
                </div>

                {/* token meta strip */}
                <div className="strip reveal">
                    <div className="wrap"><div className="strip__in">
                        <div className="stat">
                            <div className="stat__k">Network</div>
                            <div className="stat__v">Ethereum <span className="chainbadge">ERC-20</span></div>
                        </div>
                        <div className="stat">
                            <div className="stat__k">Token</div>
                            <div className="stat__v">CWT <span className="num" style={{ color: 'var(--ink-3)', fontSize: 14 }}>· Cold Wallet</span></div>
                        </div>
                        <div className="stat">
                            <div className="stat__k">Trading pair</div>
                            <div className="stat__v">CWT <span className="num" style={{ color: 'var(--ink-3)' }}>/</span> USDC</div>
                        </div>
                        <div className="stat">
                            <div className="stat__k">Contract</div>
                            <div className="stat__v">
                                <span className="addr"><code>{CONTRACT_SHORT}</code><CopyButton /></span>
                            </div>
                        </div>
                    </div></div>
                </div>
            </section>

            {/* ===== READ-ONLY / TRUST ===== */}
            <section className="band band--alt" id="security">
                <div className="wrap trust__grid">
                    <div className="trust__head reveal">
                        <p className="eyebrow"><span className="dot">●</span> Read-only by design</p>
                        <h2>It runs on your device.<br /><span className="g">There's nothing<br />to steal.</span></h2>
                        <p>Cold Wallet is a self-custodied dashboard that runs entirely on your device — there's no backend, and nowhere for your data to be sent. It only <em>reads</em> your balances through the integrations you connect, straight from where your money already lives. It never holds your keys or your coins, so there's nothing for anyone to drain.</p>
                        <a className="btn" href={GITHUB} {...ext}><IconGithub /> View source on GitHub</a>
                    </div>
                    <div className="trust__list reveal">
                        {TRUST.map((u) => <UtilRow key={u.title} {...u} />)}
                    </div>
                </div>
            </section>

            {/* ===== WHY ===== */}
            <section className="band" id="why">
                <div className="wrap">
                    <div className="sec-head reveal">
                        <p className="eyebrow"><span className="dot">●</span> Why Cold Wallet</p>
                        <h2>Your wealth, watched by you and nobody else</h2>
                        <p>Most trackers want your email, your logins, and a copy of everything you own. Cold Wallet wants none of it. It runs private, stays local, and shows your whole financial picture in one calm, fast view.</p>
                    </div>

                    <div className="features">
                        {FEATURES.map((f) => (
                            <div className="feat reveal" key={f.n}>
                                <div className="feat__ico">{f.icon}</div>
                                <span className="feat__num">{f.n}</span>
                                <h3>{f.title}</h3>
                                <p>{f.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CWT UTILITY ===== */}
            <section className="band cwt" id="cwt">
                <div className="wrap cwt__grid">
                    <div className="reveal">
                        <p className="eyebrow"><span className="dot">●</span> The CWT utility token</p>
                        <h2 className="cwt__title">One token that runs the wallet</h2>
                        <p className="cwt__intro">CWT is the native ERC-20 utility token of Cold Wallet. It isn't a points scheme — holding and using CWT unlocks real capability inside the app and a real say in where it goes next. It trades freely on-chain, today.</p>

                        <div className="util-list">
                            {CWT_UTILS.map((u) => <UtilRow key={u.title} {...u} />)}
                        </div>
                    </div>

                    <aside className="tokencard reveal">
                        <div className="tokencard__top">
                            <img className="tokencard__mark" src="/cold-wallet.svg" alt="CWT" />
                            <div>
                                <div className="tokencard__name">Cold Wallet Token</div>
                                <div className="tokencard__sym">$CWT</div>
                            </div>
                        </div>
                        <div className="tokencard__rows">
                            <div className="trow"><span className="trow__k">Network</span><span className="trow__v">Ethereum <span className="chainbadge">ERC-20</span></span></div>
                            <div className="trow"><span className="trow__k">Symbol</span><span className="trow__v num">CWT</span></div>
                            <div className="trow"><span className="trow__k">Trade on</span><span className="trow__v">SushiSwap · CMC DEX</span></div>
                            <div className="trow"><span className="trow__k">Contract</span><span className="trow__v">
                                <span className="addr"><code className="num" style={{ fontSize: 13 }}>{CONTRACT_SHORT}</code><CopyButton /></span>
                            </span></div>
                        </div>
                        <div className="tokencard__cta">
                            <a className="btn btn--p" href={SUSHI} {...ext}><IconArrowUpRight /> Buy on SushiSwap</a>
                            <a className="btn" href={CMC_DEX} {...ext}><IconChart /> Watch on CoinMarketCap DEX</a>
                        </div>
                        <p className="tokencard__note">Always verify the contract address before trading. CWT involves risk — see the whitepaper.</p>
                    </aside>
                </div>
            </section>

            {/* ===== FINAL CTA ===== */}
            <section className="finalcta">
                <div className="finalcta__glow" />
                <div className="wrap finalcta__in reveal">
                    <p className="eyebrow"><span className="dot">●</span> Private. Self-custodied. Live.</p>
                    <h2>Take your portfolio cold</h2>
                    <p>Open the dashboard in your browser or on your phone — no download, no account. Then put CWT to work across the wallet.</p>
                    <div className="finalcta__cta">
                        <a className="btn btn--p" href={DEMO}><IconPlay /> Try the demo</a>
                        <a className="btn" href={SUSHI} {...ext}>Buy on SushiSwap</a>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="site">
                <div className="wrap">
                    <div className="foot__grid">
                        <div className="foot__brand">
                            <a className="brand" href="#top">
                                <img className="brand__mark" src="/cold-wallet.svg" alt="Cold Wallet" />
                                <span className="brand__name">Cold Wallet</span>
                            </a>
                            <p className="foot__blurb">The anonymous, self-custodied portfolio dashboard. Every asset in one private view — powered by the CWT utility token.</p>
                            <div className="socials" style={{ marginTop: 18 }}>
                                <a href="#" aria-label="X / Twitter"><IconX /></a>
                                <a href="#" aria-label="Telegram"><IconTelegram /></a>
                                <a href={GITHUB} {...ext} aria-label="GitHub"><IconGithub /></a>
                            </div>
                        </div>
                        <div className="foot__col">
                            <h4>Product</h4>
                            <a href={DEMO}>Try the demo</a>
                            <a href="#why">Why Cold Wallet</a>
                            <a href={GITHUB} {...ext}>Open source · GitHub</a>
                            <a href={WHITEPAPER} {...ext}>Whitepaper</a>
                        </div>
                        <div className="foot__col">
                            <h4>CWT Token</h4>
                            <a href={SUSHI} {...ext}>Buy on SushiSwap</a>
                            <a href={CMC_DEX} {...ext}>CoinMarketCap DEX</a>
                            <a href="#cwt">Token utility</a>
                        </div>
                        <div className="foot__col">
                            <h4>Legal</h4>
                            <a href={TERMS}>Terms of Use</a>
                            <a href={PRIVACY}>Privacy Policy</a>
                            <a href={WHITEPAPER} {...ext}>Whitepaper (PDF)</a>
                        </div>
                    </div>

                    <div className="foot__bottom">
                        <div className="foot__copy">© 2026 Cold Wallet. All rights reserved.</div>
                        <div className="foot__legal">
                            <a href={TERMS}>Terms of Use</a>
                            <a href={PRIVACY}>Privacy Policy</a>
                        </div>
                    </div>

                    <p className="disclaimer">CWT is a utility token intended for use within the Cold Wallet ecosystem. Nothing on this page is financial advice or an offer to sell securities. Digital assets are volatile and carry risk. Always confirm the official contract address before transacting and read the whitepaper in full.</p>
                </div>
            </footer>
        </div>
    );
}
