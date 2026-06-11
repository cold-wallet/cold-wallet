// redesign/DonutChart.tsx — adaptive concentric donut: Holding → Currency → Type (fiat/crypto).
// Each ring is shown only when it actually merges something the finer ring outside it doesn't —
// i.e. it has ≥2 segments AND fewer than the ring just outside it. The leaf (per-holding) ring is
// always present; with a single holding it's simply one full ring. The portfolio total lives in
// the center (it replaces the old innermost "total" ring).
import React from 'react';
import { fmtUSD } from './format';
import { arcPath } from './geometry';
import type { ArcSeg } from './portfolio';

interface DonutChartProps {
  typeSegs: ArcSeg[];
  curSegs: ArcSeg[];
  leafSegs: ArcSeg[];
  total: number;
  hot: string | null;
  setHot: (key: string | null) => void;
  count: number;
}

export default function DonutChart({ typeSegs, curSegs, leafSegs, total, hot, setHot, count }: DonutChartProps) {
  const C = 50;
  const sep = 1.0;
  const span = (s: number, e: number) => (e - s >= 359.9 ? s + 359.9 : e);

  // Conditional levels: a ring earns its place only when it groups holdings the ring outside it
  // keeps separate — ≥2 segments AND fewer than the finer ring. Leaf is always shown.
  const nLeaf = leafSegs.length;
  const nCur = curSegs.length;
  const nType = typeSegs.length;
  const showCur = nCur >= 2 && nCur < nLeaf;
  const showType = nType >= 2 && nType < nCur;

  // Visible rings, outer → inner.
  const visible: ArcSeg[][] = [leafSegs];
  if (showCur) visible.push(curSegs);
  if (showType) visible.push(typeSegs);

  // Spread the [rHole .. rOuter] band evenly over however many rings are visible, leaving the
  // center hole for the total text.
  const rOuter = 48, rHole = 17, gap = 2;
  const thickness = (rOuter - rHole - gap * (visible.length - 1)) / visible.length;
  const RINGS = visible.map((segs, i) => {
    const rO = rOuter - i * (thickness + gap);
    return { segs, rO, rI: rO - thickness };
  });

  const allSegs = [...typeSegs, ...curSegs, ...leafSegs];
  const hotInfo = hot ? allSegs.find((s) => s.key === hot) : null;
  const hotSub = hotInfo
    ? (hot!.startsWith('type:') ? 'Type'
      : hot!.startsWith('cur:') ? 'Currency'
        : ((hotInfo.srcLabel as string) || 'Holding'))
    : '';

  return (
    <div className={'donut' + (hot ? ' has-hover' : '')}>
      <svg viewBox="0 0 100 100">
        {RINGS.map((ring) => ring.segs.map((s) => (
          (s.a1 - s.a0) > 0.01 && (
            <path
              key={s.key}
              className={'arc' + (hot === s.key ? ' hot' : '')}
              d={arcPath(C, C, ring.rO, ring.rI, s.a0, span(s.a0, s.a1))}
              fill={s.color}
              stroke="var(--card)"
              strokeWidth={sep}
              strokeLinejoin="round"
              onMouseEnter={() => setHot(s.key)}
              onMouseLeave={() => setHot(null)}
            />
          )
        )))}
      </svg>
      <div className="donut__center">
        {hotInfo ? (
          <>
            <div className="donut__c-label">{hotSub}</div>
            <div className="donut__c-val num">{fmtUSD(hotInfo.usd, { cents: false })}</div>
            <div className="donut__c-sub num" style={{ color: hotInfo.color }}>
              {hotInfo.label} · {hotInfo.pct.toFixed(2)}%
            </div>
          </>
        ) : (
          <>
            <div className="donut__c-label">Total</div>
            <div className="donut__c-val num">{fmtUSD(total, { cents: false })}</div>
            <div className="donut__c-sub">{count} holding{count === 1 ? '' : 's'}</div>
          </>
        )}
      </div>
    </div>
  );
}
