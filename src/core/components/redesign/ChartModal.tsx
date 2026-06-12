// redesign/ChartModal.tsx — full-screen portfolio breakdown (Expand). Sunburst
// (Total→Type→Currency→Holding) + treemap + live detail list, on real Valued data.
import React, { useMemo, useState } from 'react';
import { arcPath, shade, squarify, type SquarifyCell } from './geometry';
import { maskUSD, amountDisplay } from './format';
import AmountText from './AmountText';
import { shortenAddresses } from './visual';
import type { Valued } from './portfolio';

interface ClassColor { fiat: string; crypto: string; }
interface ChartModalProps {
  valued: Valued[];
  total: number;
  colorMap: Record<string, string>;
  classColor: ClassColor;
  chart: 'donut' | 'tree';
  hidden: boolean;
  onClose: () => void;
}

type ViewMode = 'sunburst' | 'treemap';
interface FsLeaf extends Valued { a0: number; a1: number; }
interface FsSeg { key: string; a0: number; a1: number; usd: number; items: FsLeaf[]; label: string; sub: string; }
interface RingSeg { a0: number; a1: number; usd: number; label: string; items: FsLeaf[]; code?: string; key?: string; sub?: string; }
interface TreeChild { code: string; usd: number; items: FsLeaf[]; color: string; }
interface TreeGroup { kind: 'fiat' | 'crypto'; label: string; usd: number; children: TreeChild[]; }
interface FocusInfo { label: string; sub: string; usd: number; items: Valued[]; _k?: string; }

type TreeGroupCell = SquarifyCell & TreeGroup;
type TreeChildCell = SquarifyCell & TreeChild;
interface TreeCell extends TreeChildCell { kind: 'fiat' | 'crypto'; }

const VIEWS = [['sunburst', 'Sunburst'], ['treemap', 'Treemap']] as const;

export default function ChartModal({ valued, total, colorMap, classColor, chart, hidden, onClose }: ChartModalProps) {
  const [focus, setFocus] = useState<FocusInfo | null>(null);
  const [view, setView] = useState<ViewMode>(chart === 'tree' ? 'treemap' : 'sunburst');
  const pc = (v: number, t: number) => (v / t) * 100 + '%';

  const data = useMemo(() => {
    const order = [...valued].sort((a, b) =>
      (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0) ||
      ((a.manual ? 0 : 1) - (b.manual ? 0 : 1)) ||
      (a.code < b.code ? -1 : a.code > b.code ? 1 : 0) ||
      (b.usd - a.usd));

    let acc = 0;
    const leaves: FsLeaf[] = order.map((h) => {
      const a0 = acc;
      acc += (total ? h.usd / total : 0) * 360;
      return { ...h, a0, a1: acc };
    });

    const group = (keyFn: (h: FsLeaf) => string, labelFn: (h: FsLeaf) => string, sublabelFn?: (h: FsLeaf) => string): FsSeg[] => {
      const segs: FsSeg[] = [];
      let cur: FsSeg | null = null;
      leaves.forEach((h) => {
        const k = keyFn(h);
        if (!cur || cur.key !== k) {
          cur = { key: k, a0: h.a0, a1: h.a1, usd: 0, items: [], label: labelFn(h), sub: sublabelFn ? sublabelFn(h) : '' };
          segs.push(cur);
        }
        const c = cur as FsSeg;
        c.a1 = h.a1; c.usd += h.usd; c.items.push(h);
      });
      return segs;
    };

    const tg: Record<string, TreeGroup> = {};
    const assetsByKind: Record<string, Record<string, TreeChild>> = {};
    leaves.forEach((h) => {
      if (!tg[h.kind]) { tg[h.kind] = { kind: h.kind, label: h.kind === 'crypto' ? 'Crypto' : 'Fiat', usd: 0, children: [] }; assetsByKind[h.kind] = {}; }
      tg[h.kind].usd += h.usd;
      const byCode = assetsByKind[h.kind];
      if (!byCode[h.code]) byCode[h.code] = { code: h.code, usd: 0, items: [], color: colorMap[h.code] || h.color };
      byCode[h.code].usd += h.usd;
      byCode[h.code].items.push(h);
    });
    const treeGroups: TreeGroup[] = Object.values(tg).sort((x, y) => y.usd - x.usd)
      .map((g) => ({ ...g, children: Object.values(assetsByKind[g.kind]).sort((x, y) => y.usd - x.usd) }));

    return {
      treeGroups,
      type: group((h) => h.kind, (h) => (h.kind === 'crypto' ? 'Crypto' : 'Fiat')),
      cur: group((h) => h.kind + '|' + (h.manual ? 'm' : 'i') + '|' + h.code, (h) => h.code, (h) => h.source.label),
      leaves,
    };
  }, [valued, total, colorMap]);

  const C = 100;
  const gap = 0.6;
  const RINGS: { key: string; name: string; rI: number; rO: number; segs: RingSeg[]; color: (s: RingSeg) => string }[] = [
    { key: 'type', name: 'Type', rI: 30, rO: 51, segs: data.type, color: (s) => classColor[s.items[0].kind] },
    { key: 'cur', name: 'Currency', rI: 53, rO: 74, segs: data.cur, color: (s) => colorMap[s.items[0].code] || s.items[0].color },
    { key: 'hold', name: 'Holding', rI: 76, rO: 97, segs: data.leaves.map((l) => ({ ...l, label: l.code, items: [l] })), color: (s) => shade(colorMap[s.code!] || s.items[0].color, 0.12) },
  ];

  const info: FocusInfo = focus || { label: 'Total portfolio', sub: valued.length + ' holdings', usd: total, items: valued };
  const sortedItems = [...info.items].sort((a, b) => b.usd - a.usd);

  return (
    <div className="scrim fs-scrim" onClick={onClose}>
      <div className="fs" onClick={(e) => e.stopPropagation()}>
        <div className="fs__head">
          <div>
            <div className="fs__title">Portfolio breakdown</div>
            <div className="fs__sub">{view === 'sunburst' ? 'Total → Type → Currency → Holding' : 'Type → Currency — hover any cell for detail'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="seg" style={{ padding: 3 }} onMouseEnter={() => setFocus(null)}>
              {VIEWS.map(([k, lbl]) => (
                <button key={k} className={view === k ? 'on' : ''} style={{ padding: '5px 13px', fontSize: 11.5 }} onClick={() => { setView(k); setFocus(null); }}>{lbl}</button>
              ))}
            </div>
            <button className="iconbtn" title="Close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </div>
        <div className="fs__body">
          {view === 'sunburst' ? (
            <div className={'fs__chart' + (focus ? ' has-hover' : '')}>
              <svg viewBox="0 0 200 200" onMouseLeave={() => setFocus(null)}>
                {RINGS.map((ring) => ring.segs.map((s, i) => (
                  <path
                    key={ring.key + i}
                    className={'fs-arc' + (focus && focus._k === ring.key + i ? ' hot' : '')}
                    d={arcPath(C, C, ring.rO, ring.rI, s.a0 + gap, s.a1 - gap)}
                    fill={ring.color(s)}
                    stroke="rgba(8,12,11,0.55)"
                    strokeWidth="0.6"
                    onMouseEnter={() => setFocus({ ...s, _k: ring.key + i, sub: ring.name })}
                  />
                )))}
              </svg>
              <div className="fs-center">
                <div className="fs-center__l">{focus ? focus.sub || '' : 'TOTAL'}</div>
                <div className="fs-center__v num">{maskUSD(info.usd, hidden, { cents: false })}</div>
                <div className="fs-center__p num">{total ? (info.usd / total * 100).toFixed(1) : 0}%</div>
              </div>
            </div>
          ) : (
            <div className={'fs-tm' + (focus ? ' has-hover' : '')} onMouseLeave={() => setFocus(null)}>
              {(() => {
                const W = 1000;
                const H = 740;
                const groups = squarify(data.treeGroups.map((g) => ({ ...g, value: g.usd })), 0, 0, W, H) as TreeGroupCell[];
                const cells: TreeCell[] = [];
                groups.forEach((g) => {
                  (squarify(g.children.map((c) => ({ ...c, value: c.usd })), g.x, g.y, g.w, g.h) as TreeChildCell[])
                    .forEach((c) => cells.push({ ...c, kind: g.kind }));
                });
                return (
                  <>
                    {cells.map((c) => {
                      const big = (c.w / W) * 100 > 5 && (c.h / H) * 100 > 7;
                      const k = 'tm:' + c.kind + c.code;
                      return (
                        <div
                          key={k}
                          className={'tm-cell' + (focus && focus._k === k ? ' hot' : '')}
                          style={{ left: pc(c.x, W), top: pc(c.y, H), width: pc(c.w, W), height: pc(c.h, H), background: c.color }}
                          onMouseEnter={() => setFocus({ label: c.code, sub: 'Currency', usd: c.usd, items: c.items, _k: k })}
                          title={c.code + ' · ' + (c.usd / total * 100).toFixed(2) + '%'}
                        >
                          {big && <div className="tm-cell__in"><b>{c.code}</b><span>{(c.usd / total * 100).toFixed(1)}%</span></div>}
                        </div>
                      );
                    })}
                    {groups.map((g) => (
                      <div key={'g' + g.kind} className="tm-group" style={{ left: pc(g.x, W), top: pc(g.y, H), width: pc(g.w, W), height: pc(g.h, H) }}>
                        <span className="tm-group__label">{g.label} · {(g.usd / total * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          )}

          <div className="fs__detail">
            <div className="fs-d-head">
              <div className="fs-d-name">{info.label}</div>
              <div className="fs-d-val"><span className="num">{maskUSD(info.usd, hidden)}</span> · <span className="num">{total ? (info.usd / total * 100).toFixed(2) : 0}%</span> · {info.items.length} holding{info.items.length === 1 ? '' : 's'}</div>
            </div>
            <div className="fs-d-list">
              {sortedItems.map((h) => {
                const ac = colorMap[h.code] || h.color;
                const amt = amountDisplay(h.asset.amount, h.scale, h.unitUsd);
                return (
                  <div className="fs-d-row" key={h.id}>
                    <span className="fs-d-ico" style={{ background: ac + '22', color: ac, border: '1px solid ' + ac + '55' }}>{h.sym}</span>
                    <div className="fs-d-main">
                      <div className="fs-d-asset">{shortenAddresses(h.asset.normalizedName)}</div>
                      <div className="fs-d-meta num">
                        <AmountText amt={amt} code={h.code} hidden={hidden} /> · {h.source.label}{h.manual ? ' · manual' : ''}
                      </div>
                    </div>
                    <div className="fs-d-usd">
                      <div className="num">{maskUSD(h.usd, hidden)}</div>
                      <div className="num fs-d-pct">{total ? (h.usd / total * 100).toFixed(2) : 0}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
