// redesign/FitText.tsx — shrinks the font-size of an amount so it always fits its
// container width (down to a min). Measurement-based, so any value length — even
// millions — auto-fits. Re-fits on content change and on container resize.
import React, { useLayoutEffect, useRef } from 'react';

interface FitTextProps {
  children: React.ReactNode;
  className?: string;
  max: number; // px — the design font-size when there's room
  min: number; // px — never go smaller than this
  style?: React.CSSProperties;
}

export default function FitText({ children, className, max, min, style }: FitTextProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = max + 'px';
      const avail = el.clientWidth;
      const needed = el.scrollWidth;
      if (avail > 0 && needed > avail) {
        el.style.fontSize = Math.max(min, Math.floor((max * avail) / needed * 0.97)) + 'px';
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement || el);
    return () => ro.disconnect();
  });

  return (
    <div ref={ref} className={className} style={{ whiteSpace: 'nowrap', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}
