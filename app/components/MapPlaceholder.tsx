'use client';

import { useMemo } from 'react';
import { C } from '../lib/tokens';

function seedRng(s: number) {
  let x = s;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

function makeRoutePath(seed: number, w: number, h: number, points = 8) {
  const r = seedRng(seed);
  const pts: Array<[number, number]> = [];
  const padX = w * 0.12;
  const padY = h * 0.18;
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const x = padX + t * (w - padX * 2) + (r() - 0.5) * w * 0.18;
    const y = padY + r() * (h - padY * 2);
    pts.push([x, y]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[Math.max(0, i - 1)];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = x1 + (x2 - x0) / 6;
    const cp1y = y1 + (y2 - y0) / 6;
    const cp2x = x2 - (x3 - x1) / 6;
    const cp2y = y2 - (y3 - y1) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return { d, start: pts[0], end: pts[pts.length - 1] };
}

interface Props {
  seed?: number;
  width?: number;
  height?: number;
  variant?: 'card' | 'live';
  showMarkers?: boolean;
  pulse?: boolean;
  progress?: number;
}

export default function MapPlaceholder({
  seed = 7,
  width = 343,
  height = 160,
  variant = 'card',
  showMarkers = true,
  pulse = false,
  progress = 1,
}: Props) {
  const route = useMemo(() => makeRoutePath(seed, width, height, 8), [seed, width, height]);
  const isLive = variant === 'live';
  const bg = isLive ? '#0F1E18' : C.sage;
  const water = isLive ? '#1B3F2F' : '#D0DCD2';
  const park = isLive ? '#1E3E2D' : '#DCE5D5';
  const road = isLive ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,26,0.05)';
  const grid = isLive ? 'rgba(255,255,255,0.04)' : 'rgba(26,26,26,0.04)';

  const blocks = useMemo(() => {
    const r = seedRng(seed + 99);
    return Array.from({ length: 14 }).map(() => ({
      x: r() * width,
      y: r() * height,
      w: 18 + r() * 38,
      h: 14 + r() * 26,
      rot: r() * 8 - 4,
    }));
  }, [seed, width, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block' }}
    >
      <defs>
        <pattern id={`grid-${seed}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={grid} strokeWidth="0.5" />
        </pattern>
        <linearGradient id={`fade-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg} stopOpacity="0" />
          <stop offset="1" stopColor={bg} stopOpacity={isLive ? 0.6 : 0.4} />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill={bg} />
      <rect width={width} height={height} fill={`url(#grid-${seed})`} />
      <path
        d={`M -10 ${height * 0.62} Q ${width * 0.3} ${height * 0.48}, ${width * 0.55} ${height * 0.7} T ${width + 10} ${height * 0.65} L ${width + 10} ${height + 10} L -10 ${height + 10} Z`}
        fill={water}
        opacity="0.55"
      />
      <ellipse cx={width * 0.78} cy={height * 0.28} rx={width * 0.22} ry={height * 0.18} fill={park} opacity="0.7" />
      <ellipse cx={width * 0.12} cy={height * 0.22} rx={width * 0.14} ry={height * 0.12} fill={park} opacity="0.5" />
      {blocks.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill={road}
          transform={`rotate(${b.rot} ${b.x + b.w / 2} ${b.y + b.h / 2})`}
          rx="2"
        />
      ))}
      <path d={`M 0 ${height * 0.4} L ${width} ${height * 0.42}`} stroke={road} strokeWidth="6" fill="none" />
      <path d={`M ${width * 0.35} 0 L ${width * 0.38} ${height}`} stroke={road} strokeWidth="5" fill="none" />
      <rect width={width} height={height} fill={`url(#fade-${seed})`} />
      <path
        d={route.d}
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(0,1.5)"
      />
      <path
        d={route.d}
        stroke={C.coral}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={progress < 1 ? '1000' : undefined}
        strokeDashoffset={progress < 1 ? `${1000 * (1 - progress)}` : undefined}
      />
      {showMarkers && (
        <>
          <circle cx={route.start[0]} cy={route.start[1]} r="6" fill="#fff" stroke={C.forest} strokeWidth="2.5" />
          <circle cx={route.end[0]} cy={route.end[1]} r="6" fill={C.forest} stroke="#fff" strokeWidth="2.5" />
        </>
      )}
      {pulse && (
        <>
          <circle
            cx={route.start[0] + (route.end[0] - route.start[0]) * 0.42}
            cy={route.start[1] + (route.end[1] - route.start[1]) * 0.42 + 12}
            r="14"
            fill={C.coral}
            opacity="0.18"
          >
            <animate attributeName="r" values="10;22;10" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0;0.25" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle
            cx={route.start[0] + (route.end[0] - route.start[0]) * 0.42}
            cy={route.start[1] + (route.end[1] - route.start[1]) * 0.42 + 12}
            r="6"
            fill={C.coral}
            stroke="#fff"
            strokeWidth="2.5"
          />
        </>
      )}
    </svg>
  );
}
