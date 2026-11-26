// redesign/TreemapChart.tsx — squarified treemap allocation view (Type → Holding).
import React from 'react';
import { squarify, type SquarifyCell } from './geometry';
import type { ArcSeg, ClassSlice } from './portfolio';

interface TreemapChartProps {
  classes: ClassSlice[];
  leafSegs: ArcSeg[];
  hot: string | null;
  setHot: (key: string | null) => void;
}

interface GroupCell extends SquarifyCell { key: string; label: string; pct: number; }
interface LeafCell extends SquarifyCell { key: string; label: string; color: string; pct: number; srcLabel?: string; }

export default function TreemapChart({ classes, leafSegs, hot, setHot }: TreemapChartProps) {
  const W = 1000;
  const H = 500;
  const pc = (v: number, t: number) => (v / t) * 100 + '%';

  const groups = squarify(
    classes.map((c) => ({ key: c.key, label: c.label, value: c.usd, pct: c.pct })),
    0, 0, W, H,
  ) as GroupCell[];

  const cells: LeafCell[] = [];
  groups.forEach((g) => {
    const items = leafSegs.filter((l) => l.kind === g.key).map((l) => ({ ...l, value: l.usd }));
    (squarify(items, g.x, g.y, g.w, g.h) as LeafCell[]).forEach((s) => cells.push(s));
  });

  return (
    <div className={'treemap' + (hot ? ' has-hover' : '')}>
      {cells.map((c) => {
        const big = (c.w / W) * 100 > 8 && (c.h / H) * 100 > 13;
        return (
          <div
            key={c.key}
            className={'tm-cell' + (hot === c.key ? ' hot' : '')}
            style={{ left: pc(c.x, W), top: pc(c.y, H), width: pc(c.w, W), height: pc(c.h, H), background: c.color }}
            onMouseEnter={() => setHot(c.key)}
            onMouseLeave={() => setHot(null)}
            title={c.label + ' · ' + c.srcLabel + ' · ' + c.pct.toFixed(2) + '%'}
          >
            {big && <div className="tm-cell__in"><b>{c.label}</b><span>{c.pct.toFixed(1)}%</span></div>}
          </div>
        );
      })}
      {groups.map((g) => (
        <div
          key={'g' + g.key}
          className="tm-group"
          style={{ left: pc(g.x, W), top: pc(g.y, H), width: pc(g.w, W), height: pc(g.h, H) }}
        >
          <span className="tm-group__label">{g.label} · {g.pct.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
