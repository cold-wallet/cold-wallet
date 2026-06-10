// redesign/DonutChart.tsx — three-ring donut: Type → Currency → Holding (hand-rolled SVG).
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

  const RINGS = [
    { segs: typeSegs, rO: 27, rI: 17 },
    { segs: curSegs, rO: 38, rI: 29 },
    { segs: leafSegs, rO: 48, rI: 40 },
  ];

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
