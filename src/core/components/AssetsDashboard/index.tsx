import './index.css';

import React, { useMemo, useState } from "react";
import { AccountInfo } from "../../integrations/binance/binanceApiClient";
import { OkxAccount } from "../../integrations/okx/okxApiClient";
import MonobankUserData from "../../integrations/monobank/MonobankUserData";
import AssetDTO from "../../domain/AssetDTO";
import Props from "../Props";

import EditDialog from "../redesign/EditDialog";
import ConfirmDelete from "../redesign/ConfirmDelete";
import SettingsDialog from "../redesign/SettingsDialog";
import LoadingView from "../redesign/LoadingView";
import ChartModal from "../redesign/ChartModal";
import FitText from "../redesign/FitText";
import DonutChart from "../redesign/DonutChart";
import TreemapChart from "../redesign/TreemapChart";
import HoldingRow from "../redesign/HoldingRow";
import { NumericFormat } from "react-number-format";
import { fmtUSD, splitCents, maskUSD, AMOUNT_MASK, amountDisplay } from "../redesign/format";
import { shortenAddresses } from "../redesign/visual";
import {
    assetSlices,
    chartData,
    classSlices,
    sidebarGroups,
    sourceBreakdown,
    totalUsd,
    valueAssets,
} from "../redesign/portfolio";

export default function AssetsDashboard({ props }: { props: Props }) {
    const [q, setQ] = useState("");
    const [hot, setHot] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [breakdownOpen, setBreakdownOpen] = useState(false);
    const view = props.firstPageChartView === 'tree' ? 'tree' : 'donut';

    // Aggregate manual + every connected integration into one AssetDTO[] (same as the old stats).
    const allAssets: AssetDTO[] = useMemo(() => {
        let assets = [...props.userData.assets];
        if (props.userData.settings.binanceIntegrationEnabled && props.binanceUserData) {
            assets = assets.concat(AccountInfo.getAllAssets(props.binanceUserData));
        }
        if (props.userData.settings.monobankIntegrationEnabled && props.monobankUserData) {
            assets = assets.concat(MonobankUserData.getAllAssets(props.monobankUserData));
        }
        if (props.userData.settings.okxIntegrationEnabled && props.okxUserData) {
            assets = assets.concat(OkxAccount.getAllAssets(props.okxUserData));
        }
        if (props.metaMaskSettingsEnabled && props.metaMaskAssets) {
            assets = assets.concat(props.metaMaskAssets);
        }
        return Object.values(props.ccxtUserData).reduce((merged, current) => merged.concat(current), assets);
    }, [
        props.userData,
        props.binanceUserData,
        props.okxUserData,
        props.monobankUserData,
        props.metaMaskAssets,
        props.ccxtUserData,
    ]);

    const valued = useMemo(() => valueAssets(allAssets, props.priceService), [allAssets, props.priceService]);
    const total = useMemo(() => totalUsd(valued), [valued]);
    const classes = useMemo(() => classSlices(valued, total), [valued, total]);
    const slices = useMemo(() => assetSlices(valued, total), [valued, total]);
    const chart = useMemo(() => chartData(valued, slices, classes, total), [valued, slices, classes, total]);
    const groups = useMemo(() => sidebarGroups(valued, q), [valued, q]);
    const sources = useMemo(() => sourceBreakdown(valued, total), [valued, total]);

    const sourceCount = new Set(valued.map((h) => h.source.key)).size;
    const maxLeaf = Math.max(...chart.leafSegs.map((l) => l.usd), 1);
    const hidden = props.hideAmounts;
    const totalStr = hidden ? AMOUNT_MASK : fmtUSD(total);
    // "<$0.01" (sub-cent dust) has no cents tail to mute — keep it whole.
    const [totalInt, totalCents] = (hidden || totalStr.startsWith('<')) ? [totalStr, ''] : splitCents(totalStr);

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
        props.setNewAssetAmount(asset.amount);
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
                    valued={valued}
                    total={total}
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
                        <div className="brand__mark">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /></svg>
                        </div>
                        <div>
                            <div className="brand__name">Cold Wallet</div>
                            <div className="brand__sub">Portfolio</div>
                        </div>
                        <div className="brand__spacer" />
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
                            <FitText className="total__val num" max={32} min={16}>{totalInt}<span className="cents">{totalCents}</span></FitText>
                        </div>
                        {!props.loaded && <div className="total__delta num" title="Syncing market data">syncing…</div>}
                    </div>
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
                                <span className="group__chip" style={{ background: g.tint }}>{g.mark}</span>
                                <span className="group__name">{g.label}</span>
                                <span className="group__sum num">{maskUSD(g.sum, hidden, { cents: false })}</span>
                            </div>
                            {g.items.map((h) => (
                                <HoldingRow
                                    key={h.id}
                                    h={h}
                                    hidden={hidden}
                                    active={activeId === h.id}
                                    onSelect={setActiveId}
                                    onEdit={() => editAsset(h.asset)}
                                    onDelete={() => deleteAsset(h.asset)}
                                    onRefresh={h.asset.isMetaMaskAsset ? () => props.refreshMetaMaskAsset(h.id) : undefined}
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
                    {classes.map((c) => (
                        <div className="statcard" key={c.key}>
                            <div className="statcard__label">{c.label}</div>
                            <FitText className="statcard__val num" max={26} min={13}>{maskUSD(c.usd, hidden)}</FitText>
                            <div className="statcard__row">
                                <span className="dot" style={{ background: c.color }} />
                                <span className="num">{c.pct.toFixed(2)}%</span> of portfolio
                            </div>
                            <div className="splitbar">
                                {slices.filter((a) => a.kind === c.key).map((a) => (
                                    <span key={a.key} title={a.label} style={{ flex: a.usd, background: a.color }} />
                                ))}
                            </div>
                        </div>
                    ))}
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
                    <div className="chartwrap">
                        {view === 'tree'
                            ? <TreemapChart classes={classes} leafSegs={chart.leafSegs} hot={hot} setHot={setHot} />
                            : <DonutChart typeSegs={chart.typeSegs} curSegs={chart.curSegs} leafSegs={chart.leafSegs} total={total} hot={hot} setHot={setHot} count={chart.leafSegs.length} hidden={hidden} />}
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
                                        <span className="legend__chip" style={{ background: l.color + '22', color: l.color, border: '1px solid ' + l.color + '55' }}>{(l.code as string || '').slice(0, 3)}</span>
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
                </div>

                <div className="toprow toprow--single">
                    <div className="panel-lg">
                        <div className="panel-lg__head">
                            <div className="panel-lg__title">By source</div>
                            <div className="panel-lg__hint">{sourceCount} connected</div>
                        </div>
                        {sources.map((s) => (
                            <div className="mini" key={s.key}>
                                <span className="group__chip" style={{ background: s.tint, marginRight: 2 }}>{s.mark}</span>
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
