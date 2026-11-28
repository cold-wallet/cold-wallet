// VaultEmblem — the Cold Wallet shield with its snowflake, drawn inline so the snowflake can turn
// like the wheel of a vault door. Several can be on screen at once (each door carries one half),
// so gradient ids are made unique per instance.
import React, { forwardRef, useId } from 'react';

const SHIELD = 'M256 116 L368 172 V256 C368 326 319 375.5 256 396 C193 375.5 144 326 144 256 V172 Z';
const ARM = 'M0 -50 L23 -73 M0 -50 L-23 -73 M0 -74 L14 -89 M0 -74 L-14 -89';

interface Props {
  className?: string;
}

/** The ref is the snowflake group, for turning it. */
const VaultEmblem = forwardRef<SVGGElement, Props>(function VaultEmblem({ className }, wheel) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="128 104 256 312" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}s`} x1="150" y1="116" x2="372" y2="396" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#52e7b2" />
          <stop offset="0.52" stopColor="#34d39a" />
          <stop offset="1" stopColor="#1d9d6c" />
        </linearGradient>
        <linearGradient id={`${id}h`} x1="256" y1="116" x2="256" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={SHIELD} fill={`url(#${id}s)`} />
      <path d={SHIELD} fill={`url(#${id}h)`} />
      <path d={SHIELD} stroke="#0c4a33" strokeOpacity="0.45" strokeWidth="3" />
      <g transform="translate(256 244)">
        <g ref={wheel} className="vault-wheel" stroke="#08130d" strokeLinecap="round" strokeLinejoin="round">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <path d="M0 0 V-92" strokeWidth="24" />
              <path d={ARM} strokeWidth="13" />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
});

export default VaultEmblem;
