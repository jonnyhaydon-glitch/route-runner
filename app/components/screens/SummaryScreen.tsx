'use client';

import { useEffect, useMemo, useState } from 'react';
import { Heart, Upload, Users } from 'lucide-react';
import MapPlaceholder from '../MapPlaceholder';
import { C } from '../../lib/tokens';
import { SummaryStat } from './shared';
import type { GeneratedRoute } from '../../lib/screen-state';

interface Props {
  route: GeneratedRoute;
  elapsedSeconds: number;
  distanceKm: number;
  onDone: () => void;
}

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export default function SummaryScreen({ route, elapsedSeconds, distanceKm, onDone }: Props) {
  const [confetti, setConfetti] = useState(true);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setConfetti(false), 2800);
    return () => clearTimeout(t);
  }, []);

  const dateLabel = useMemo(() => {
    const d = new Date();
    return `${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }, []);

  // The Live screen ticks distanceKm up from 0 at ~5min/km even when the run is just a few seconds long;
  // anything under 100m is treated as "didn't really run" and we fall back to the planned route distance.
  const finalKm = distanceKm > 0.1 ? distanceKm : route.distanceMeters / 1000;
  const finalElapsed = elapsedSeconds > 5 ? elapsedSeconds : route.durationSeconds;
  const avgPaceSec = finalKm > 0 ? finalElapsed / finalKm : 0;
  const avgPaceStr = formatPace(avgPaceSec);
  const timeStr = formatTime(finalElapsed);
  const calories = Math.round(finalKm * 79);

  const splits = useMemo(() => {
    const n = Math.max(1, Math.min(5, Math.floor(finalKm)));
    return Array.from({ length: n }).map((_, i) => {
      const pace = avgPaceSec + (Math.sin(i * 1.7) * 8);
      const delta = Math.round(pace - avgPaceSec);
      return {
        km: i + 1,
        pace: formatPace(pace),
        delta: delta === 0 ? '±00' : delta < 0 ? `−${String(-delta).padStart(2, '0')}` : `+${String(delta).padStart(2, '0')}`,
        isNeg: delta < 0,
        widthPct: 50 + (delta < 0 ? 18 : -8) + i * 4,
      };
    });
  }, [finalKm, avgPaceSec]);

  return (
    <div style={{ position: 'relative', paddingBottom: 110 }}>
      {confetti && <Confetti />}
      <div style={{ padding: '20px 20px 18px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: C.ink60,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
          }}
        >
          {dateLabel}
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.ink, letterSpacing: -0.8, marginTop: 4 }}>
          Nice run, Alex
        </div>
        <div style={{ fontSize: 14, color: C.ink60, marginTop: 4 }}>
          {route.name} · finished at {route.destinationLabel || 'your destination'}
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ background: C.forest, borderRadius: 22, padding: '18px 20px', color: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
            <SummaryStat label="Distance" value={finalKm.toFixed(2)} unit="km" />
            <SummaryStat label="Time" value={timeStr} unit="min" />
            <SummaryStat label="Avg pace" value={avgPaceStr} unit="/km" />
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 14 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            <SummaryStat label="Elevation" value={`+${route.elevationMeters}`} unit="m" small />
            <SummaryStat label="Calories" value={String(calories)} unit="kcal" small />
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <div
          style={{
            height: 160,
            borderRadius: 20,
            overflow: 'hidden',
            border: `1px solid ${C.ink08}`,
          }}
        >
          <MapPlaceholder seed={route.seed} width={335} height={160} />
        </div>
      </div>

      <div style={{ padding: '0 20px 18px' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: C.ink60,
            letterSpacing: 0.2,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Splits
        </div>
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.ink08}` }}>
          {splits.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: i < splits.length - 1 ? `1px solid ${C.ink08}` : 'none',
                fontSize: 14,
              }}
            >
              <div style={{ width: 36, color: C.ink60, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {s.km} km
              </div>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: C.sage,
                  borderRadius: 3,
                  marginRight: 12,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(20, Math.min(96, s.widthPct))}%`,
                    height: '100%',
                    background: s.isNeg ? C.coral : C.forest,
                    borderRadius: 3,
                  }}
                />
              </div>
              <div
                style={{
                  color: C.ink,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  marginRight: 8,
                }}
              >
                {s.pace}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  color: s.isNeg ? C.forest : C.ink60,
                  width: 32,
                  textAlign: 'right',
                }}
              >
                {s.delta}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <button
          onClick={() => setShared((s) => !s)}
          style={{
            all: 'unset',
            cursor: 'pointer',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderRadius: 16,
            background: '#fff',
            border: `1px solid ${C.ink08}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Users size={18} color={C.forest} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Share with the community</div>
              <div style={{ fontSize: 12, color: C.ink60, marginTop: 1 }}>Help other runners discover this route</div>
            </div>
          </div>
          <div
            style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              padding: 2,
              boxSizing: 'border-box',
              background: shared ? C.coral : C.ink20,
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                background: '#fff',
                transform: `translateX(${shared ? 18 : 0}px)`,
                transition: 'transform 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
            />
          </div>
        </button>
      </div>

      <div style={{ padding: '0 20px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          style={{
            all: 'unset',
            cursor: 'pointer',
            boxSizing: 'border-box',
            width: '100%',
            padding: '15px',
            borderRadius: 16,
            background: C.trackerOrange,
            color: '#fff',
            textAlign: 'center',
            fontSize: 15,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 6px 16px rgba(252,82,0,0.28)',
          }}
        >
          <Upload size={16} strokeWidth={2.4} />
          Sync to tracker
        </button>
        <button
          style={{
            all: 'unset',
            cursor: 'pointer',
            boxSizing: 'border-box',
            width: '100%',
            padding: '15px',
            borderRadius: 16,
            background: '#fff',
            color: C.ink,
            textAlign: 'center',
            fontSize: 15,
            fontWeight: 600,
            border: `1.5px solid ${C.ink20}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Heart size={16} strokeWidth={2.4} />
          Save to favourites
        </button>
      </div>
      <div style={{ textAlign: 'center', padding: '4px 20px 8px' }}>
        <button
          onClick={onDone}
          style={{ all: 'unset', cursor: 'pointer', color: C.forest, fontSize: 14, fontWeight: 600, padding: 8 }}
        >
          Back to Discover
        </button>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(() => {
    const r = mulberry(42);
    return Array.from({ length: 28 }).map(() => ({
      left: r() * 100,
      delay: r() * 0.4,
      dur: 1.5 + r() * 1.2,
      color: ['#FF6B47', '#1F3A2E', '#F5C26B', '#D5DDD0'][Math.floor(r() * 4)],
      rot: r() * 360,
      shape: Math.floor(r() * 2),
    }));
  }, []);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 20,
      }}
    >
      {pieces.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: -20,
            width: 8,
            height: p.shape === 0 ? 12 : 8,
            background: p.color,
            borderRadius: p.shape === 0 ? 1 : 4,
            transform: `rotate(${p.rot}deg)`,
            animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

function mulberry(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function formatPace(secondsPerKm: number): string {
  if (!isFinite(secondsPerKm) || secondsPerKm <= 0) return '—';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
