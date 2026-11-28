import './index.css';

import React, { useMemo, useState } from "react";
import AssetDTO from "../../domain/AssetDTO";
import Props from "../Props";

import EditDialog from "../dialogs/EditDialog";
import ConfirmDelete from "../dialogs/ConfirmDelete";
import SettingsDialog from "../dialogs/SettingsDialog";
import LoadingView from "../dashboard/LoadingView";
import ChartModal from "../dashboard/ChartModal";
import FitText from "../dashboard/FitText";
import DonutChart from "../dashboard/DonutChart";
import TreemapChart from "../dashboard/TreemapChart";
import HoldingRow from "../dashboard/HoldingRow";
import PendingValue from "../dashboard/PendingValue";
import RefreshButton from "../dashboard/RefreshButton";
import { assetView, headerView, sourceView } from "../../refresh/describe";
import { NumericFormat } from "react-number-format";
import { fmtUSD, splitCents, maskUSD, AMOUNT_MASK, amountDisplay } from "../../ui/format";
import { assetSym, shortenAddresses } from "../../ui/visual";
import { CoinChip, SourceMark } from "../dashboard/AssetIcon";
import { normalizeAmount } from "../../utils/amount";
import {
    assetSlices,
    chartData,
    classSlices,
    sidebarGroups,
    sourceBreakdown,
    totalUsd,
    valueAssets,
} from "../../ui/portfolio";

export default function AssetsDashboard({ props }: { props: Props }) {
    const [q, setQ] = useState("");
    const [hot, setHot] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [breakdownOpen, setBreakdownOpen] = useState(false);
    const view = props.firstPageChartView === 'tree' ? 'tree' : 'donut';

    // every holding: manual + each connected integration (collected in ColdWallet)
    const allAssets: AssetDTO[] = props.allAssets;

    // Hide sub-cent MetaMask dust unless the user turned it off in MetaMask settings (default ON).
    const hideMmDust = props.userData.settings.metaMask?.hideSmallAssets !== false;
    const valued = useMemo(() => valueAssets(allAssets, props.priceService, hideMmDust, props.pricePending),
        // pricePending is a new function each render; what it answers changes with these
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [allAssets, props.priceService, hideMmDust, props.syncing, props.pricePending]);
    const total = useMemo(() => totalUsd(valued), [valued]); // true net incl. negatives — headline Total only
    // Proportion visuals (donut/treemap/legend, Fiat/Crypto cards, By source) can't draw a negative
    // slice, so they run on positives only; percentages are taken against the positive sum (0–100%).
    // The negative asset still shows in the sidebar list and counts toward the headline Total above.
    const chartValued = useMemo(() => valued.filter((h) => h.usd > 0), [valued]);
    const chartTotal = useMemo(() => totalUsd(chartValued), [chartValued]);
    const classes = useMemo(() => classSlices(chartValued, chartTotal), [chartValued, chartTotal]);
    const slices = useMemo(() => assetSlices(chartValued, chartTotal), [chartValued, chartTotal]);
    const chart = useMemo(() => chartData(chartValued, slices, classes, chartTotal), [chartValued, slices, classes, chartTotal]);
    const groups = useMemo(() => sidebarGroups(valued, q), [valued, q]);
    const sources = useMemo(() => sourceBreakdown(chartValued, chartTotal), [chartValued, chartTotal]);

    const sourceCount = new Set(valued.map((h) => h.source.key)).size;
    const loadingCount = valued.filter((h) => h.pending).length;
    const noPriceCount = valued.filter((h) => !h.priced && !h.pending).length;
    const notCounted = loadingCount + noPriceCount;
    const nothingPriced = valued.length > 0 && notCounted === valued.length;
    const holdings = (n: number) => `${n} holding${n === 1 ? '' : 's'}`;
    const maxLeaf = Math.max(...chart.leafSegs.map((l) => l.usd), 1);
    const hidden = props.hideAmounts;
    const totalStr = hidden ? AMOUNT_MASK : fmtUSD(total);
    // "<$0.01" (sub-cent dust) has no cents tail to mute — keep it whole.
    const [totalInt, totalCents] = (hidden || totalStr.startsWith('<')) ? [totalStr, ''] : splitCents(totalStr);

    // a holding's own refresh button, for sources that can load part of an account
    function refreshOf(asset: AssetDTO) {
        const scope = props.refresh.assetScope(asset);
        if (!scope) return undefined;
        return {
            view: (now: number) => assetView(props.refresh.status, scope, now),
            onClick: () => props.refresh.refreshAsset(asset),
        };
    }

    function openAdd() {
        props.stateReset();
        props.setShowCreateNewAssetWindow(true);
        props.setCreatingNewAsset(true);
    }
    function openSettings() {
        props.stateReset();
        props.setShowConfigsWindow(true);
    }
    function editAsset(asset: AssetDTO) {
        props.stateReset();
        props.setAssetToEdit(asset);
        // Open with the canonical value (a legacy "1012.0000000000000000000" shows as "1012") but
        // never rounded to the currency's precision: opening a holding to rename it must not change
        // its amount. Falls back to the raw string if it can't be parsed.
        props.setNewAssetAmount(normalizeAmount(asset.amount) ?? asset.amount);
        props.setNewAssetName(asset.name);
    }
    function deleteAsset(asset: AssetDTO) {
        props.stateReset();
        props.setAssetToDelete(asset);
    }

    return (
        <div className="app">
            {!props.loaded && <LoadingView props={props} />}
            {/* CRUD dialogs (new look, real mechanics); settings restyled in a later phase */}
            {(props.creatingNewAsset || props.assetToEdit) ? <EditDialog props={props} /> : null}
            {props.assetToDelete ? <ConfirmDelete props={props} /> : null}
            {props.showConfigsWindow ? <SettingsDialog props={props} /> : null}
            {breakdownOpen ? (
                <ChartModal
                    valued={chartValued}
                    total={chartTotal}
                    hidden={hidden}
                    chart={view}
                    colorMap={Object.fromEntries(slices.map((a) => [a.key, a.color]))}
                    classColor={{ fiat: classes[0].color, crypto: classes[1].color }}
                    onClose={() => setBreakdownOpen(false)}
                />
            ) : null}

            {/* ===== Sidebar ===== */}
            <aside className="side">
                <div className="side__head">
                    <div className="brand">
                        <div className="brand__mark brand__mark--logo">
                            <img src="/favicon.svg" alt="" />
                        </div>
                        <div>
                            <div className="brand__name">Cold Wallet</div>
                            <div className="brand__sub">{props.isDemoMode ? 'Demo mode' : 'Portfolio'}</div>
                        </div>
                        <div className="brand__spacer" />
                        {props.isDemoMode && (
                            <button className="iconbtn" title="Exit demo" onClick={() => window.location.assign('/')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <path d="M16 17l5-5-5-5" />
                                    <path d="M21 12H9" />
                                </svg>
                            </button>
                        )}
                        <RefreshButton
                            className="iconbtn refresh"
                            label="Refresh all"
                            view={(now) => headerView(props.refresh.status, now)}
                            onClick={props.refresh.refreshAll}
                        />
                        {!props.isDemoMode && props.userDataHolder.pinCodeEncrypted && (
                            <button className="iconbtn" title="Lock" onClick={props.lockWallet}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="4" y="10" width="16" height="11" rx="2" />
                                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                                </svg>
                            </button>
                        )}
                        <button className="iconbtn" title={hidden ? 'Show amounts' : 'Hide amounts'} onClick={props.toggleHideAmounts}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {hidden
                                    ? <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM1 1l22 22" />
                                    : <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />}
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </button>
                        <button className="iconbtn" title="Settings" onClick={openSettings}>
                            <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" clipRule="evenodd"><path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.3 7.3 0 0 0-1.69-.98l-.38-2.65A.49.49 0 0 0 14.13 2h-4a.49.49 0 0 0-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65c-.04.32-.07.66-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.14.24.42.32.61.22l2.49-1c.52.39 1.08.73 1.69.98l.38 2.65c.04.24.25.42.49.42h4c.24 0 .45-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.19.1.47.02.61-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" /></svg>
                        </button>
                    </div>
                    <div className="total">
                        <div>
                            <div className="total__label">Total balance</div>
                            {/* nothing priced yet: not "$0.00", which reads as an empty wallet */}
                            {nothingPriced
                                ? <div className="total__val num">{loadingCount ? <PendingValue /> : '—'}</div>
                                : <FitText className="total__val num" max={32} min={16}>{totalInt}<span className="cents">{totalCents}</span></FitText>}
                        </div>
                        {props.pricesStale && (
                            <div className="total__delta total__delta--warn" title="A price source hasn't answered: some values may use prices saved earlier">
                                may be outdated
                            </div>
                        )}
                    </div>
                    {notCounted > 0 && (
                        <div className="total__note" role="status">
                            {!noPriceCount
                                ? `${holdings(loadingCount)} not counted yet: price loading`
                                : !loadingCount
                                    ? `${holdings(noPriceCount)} not counted: no price`
                                    : `${holdings(notCounted)} not counted: ${loadingCount} price loading, ${noPriceCount} no price`}
                        </div>
                    )}
                </div>

                <div className="searchrow">
                    <div className="search">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
                        <input placeholder="Search assets or sources" value={q} onChange={(e) => setQ(e.target.value)} />
                    </div>
                    <button className="addbtn" onClick={openAdd}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
                        Add
                    </button>
                </div>

                <div className="list">
                    {groups.map((g) => (
                        <div className="group" key={g.k}>
                            <div className="group__head">
                                <SourceMark className="group__chip" icon={g.icon} mark={g.mark} tint={g.tint} />
                                <span className="group__name">{g.label}</span>
                                {/* next to the name, so the sums stay aligned with the amounts below */}
                                {g.k !== 'manual' && (
                                    <RefreshButton
                                        className="act act--sm refresh group__refresh"
                                        label={'Refresh ' + g.label}
                                        view={(now) => sourceView(props.refresh.status, g.k, now)}
                                        onClick={() => props.refresh.refreshSource(g.k)}
                                    />
                                )}
                                <span className="group__sum num">
                                    {g.unpriced === g.items.length
                                        ? (g.pending ? <PendingValue /> : '—')
                                        : maskUSD(g.sum, hidden, { cents: false })}
                                    {g.unpriced > 0 && g.unpriced < g.items.length && (
                                        <span className="group__more" title={`${holdings(g.unpriced)} not counted: ${g.pending ? 'price loading' : 'no price'}`}>+{g.unpriced}</span>
                                    )}
                                </span>
                            </div>
                            {g.k === 'metamask' && props.refresh.metaMaskScan && (
                                <ScanLine label="Searching tokens" progress={props.refresh.metaMaskScan} />
                            )}
                            {g.items.map((h) => (
                                <HoldingRow
                                    key={h.id}
                                    h={h}
                                    hidden={hidden}
                                    active={activeId === h.id}
                                    onSelect={setActiveId}
                                    onEdit={() => editAsset(h.asset)}
                                    onDelete={() => deleteAsset(h.asset)}
                                    refresh={refreshOf(h.asset)}
                                />
                            ))}
                        </div>
                    ))}
                    {groups.length === 0 && (
                        <div className="emptylist">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
                            <div className="emptylist__t">{props.anyAssetExist ? `No holdings match “${q}”.` : 'No holdings yet'}</div>
                            {!props.anyAssetExist && <div className="emptylist__s">Add your first asset or connect a source to get started.</div>}
                            {!props.anyAssetExist && (
                                <button className="addbtn" onClick={openAdd}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
                                    Add asset
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </aside>

            {/* ===== Overview ===== */}
            <main className="main">
                <div className="main__head">
                    <div className="main__title">
                        Overview <span>· {valued.length} holding{valued.length === 1 ? '' : 's'} across {sourceCount} source{sourceCount === 1 ? '' : 's'}</span>
                    </div>
                </div>

                <div className="cards">
                    {classes.map((c) => {
                        const inClass = valued.filter((h) => h.kind === c.key);
                        const classNotCounted = inClass.filter((h) => !h.priced).length;
                        const classNothingPriced = classNotCounted > 0 && classNotCounted === inClass.length;
                        const classPending = inClass.some((h) => h.pending);
                        return (
                        <div className="statcard" key={c.key}>
                            <div className="statcard__label">{c.label}</div>
                            {classNothingPriced
                                ? <div className="statcard__val num">{classPending ? <PendingValue /> : '—'}</div>
                                : <FitText className="statcard__val num" max={26} min={13}>{maskUSD(c.usd, hidden)}</FitText>}
                            <div className="statcard__row">
                                <span className="dot" style={{ background: c.color }} />
                                {classNothingPriced
                                    ? <span>{classPending ? 'price loading' : 'no price'}</span>
                                    : <><span className="num">{c.pct.toFixed(2)}%</span> of portfolio</>}
                                {classNotCounted > 0 && !classNothingPriced && <span> · {classNotCounted} not counted</span>}
                            </div>
                            <div className="splitbar">
                                {slices.filter((a) => a.kind === c.key).map((a) => (
                                    <span key={a.key} title={a.label} style={{ flex: a.usd, background: a.color }} />
                                ))}
                            </div>
                        </div>
                        );
                    })}
                </div>

                <div className="panel-lg">
                    <div className="panel-lg__head">
                        <div className="panel-lg__title">Allocation</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="seg" style={{ padding: 3 }}>
                                {(['donut', 'tree'] as const).map((k) => (
                                    <button key={k} className={view === k ? 'on' : ''} style={{ padding: '5px 12px', fontSize: 11.5 }}
                                        onClick={() => props.setFirstPageChartView(k === 'donut' ? 'pie' : 'tree')}>
                                        {k === 'donut' ? 'Donut' : 'Treemap'}
                                    </button>
                                ))}
                            </div>
                            <button className="expandbtn" onClick={() => setBreakdownOpen(true)} title="Full breakdown">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                                Expand
                            </button>
                        </div>
                    </div>
                    {chart.leafSegs.length === 0 && notCounted > 0 ? (
                        /* holdings, but none priced yet: not an empty "$0" chart */
                        <div className="chart-pending" role="status">
                            {loadingCount ? <><PendingValue /><span>Prices loading</span></> : <span>No prices for these holdings</span>}
                        </div>
                    ) : (
                    <div className="chartwrap">
                        {view === 'tree'
                            ? <TreemapChart classes={classes} leafSegs={chart.leafSegs} hot={hot} setHot={setHot} />
                            : <DonutChart typeSegs={chart.typeSegs} curSegs={chart.curSegs} leafSegs={chart.leafSegs} total={chartTotal} hot={hot} setHot={setHot} count={chart.leafSegs.length} hidden={hidden} />}
                        <div className="legend legend--holdings">
                            {[...chart.leafSegs].sort((a, b) => b.usd - a.usd).map((l) => {
                                const amt = amountDisplay(l.amount as string, l.scale as number);
                                return (
                                    <div
                                        key={l.id as string}
                                        className={'legend__item' + (hot === l.key ? ' hot' : '')}
                                        onMouseEnter={() => setHot(l.key)}
                                        onMouseLeave={() => setHot(null)}
                                    >
                                        <span className="legend__fill" style={{ width: (l.usd / maxLeaf) * 100 + '%', background: l.color }} />
                                        <CoinChip className="legend__chip" code={l.code as string || ''} kind={l.kind as 'fiat' | 'crypto'} color={l.color} text={Array.from(assetSym(l.code as string || '')).slice(0, 3).join('')} />
                                        <span className="legend__amt num">
                                            {hidden ? `${AMOUNT_MASK}\u00A0${l.code}` : (
                                                <><NumericFormat displayType="text" thousandSeparator valueIsNumericString decimalScale={amt.decimalScale} value={amt.value} />{'\u00A0'}{l.code}</>
                                            )}
                                        </span>
                                        <span className="legend__usd num">{maskUSD(l.usd, hidden, { cents: false })}</span>
                                        <span className="legend__sub">{shortenAddresses(l.name as string)} <small>· {l.srcLabel as string}</small></span>
                                        <span className="legend__pct num">{l.pct.toFixed(2)}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    )}
                </div>

                <div className="toprow toprow--single">
                    <div className="panel-lg">
                        <div className="panel-lg__head">
                            <div className="panel-lg__title">By source</div>
                            <div className="panel-lg__hint">{sourceCount} connected</div>
                        </div>
                        {sources.map((s) => (
                            <div className="mini" key={s.key}>
                                <SourceMark className="group__chip" icon={s.icon} mark={s.mark} tint={s.tint} style={{ marginRight: 2 }} />
                                <span className="mini__name" style={{ width: 110 }}>{s.label}</span>
                                <span className="mini__bar"><i style={{ width: s.pct + '%', background: 'var(--accent)' }} /></span>
                                <span className="mini__val num">
                                    <span className="mini__usd">{maskUSD(s.usd, hidden, { cents: false })}</span>
                                    <span className="mini__pct">{s.pct.toFixed(1)}%</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

/** A long background job with a known size (the MetaMask token search): a thin bar and a count. */
function ScanLine({ label, progress }: { label: string; progress: { done: number; total: number } }) {
    const pct = progress.total ? Math.min(100, (progress.done / progress.total) * 100) : 0;
    const text = `${label} · ${progress.done.toLocaleString('en-US')} / ${progress.total.toLocaleString('en-US')}`;
    return (
        <div className="scanline" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={progress.total}
             aria-valuenow={progress.done} title={text}>
            <span className="scanline__bar"><i style={{ width: pct + '%' }} /></span>
            <span className="scanline__txt">{label} {Math.floor(pct)}%</span>
        </div>
    );
}
