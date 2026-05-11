'use client';

import { useEffect, useState } from 'react';
import { CornerUpRight, Flag, Pause, Play, RotateCcw, Sparkles, Zap } from 'lucide-react';
import MapPlaceholder from '../MapPlaceholder';
import Map from '../Map';
import { C } from '../../lib/tokens';
import { BigStat } from './shared';
import type { GeneratedRoute } from '../../lib/screen-state';

interface Props {
  route: GeneratedRoute;
  onFinish: (stats: { elapsedSeconds: number; distanceKm: number }) => void;
}

export default function LiveRunScreen({ route, onFinish }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    const t1 = setTimeout(() => setShowBanner(true), 3500);
    const t2 = setTimeout(() => setShowBanner(false), 8500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const distanceKm = elapsed * 0.0046;
  const paceMin = 4 + Math.sin(elapsed / 6) * 0.4 + 1;
  const paceStr =
    elapsed > 5
      ? `${Math.floor(paceMin)}:${String(Math.round((paceMin % 1) * 60)).padStart(2, '0')}`
      : '5:18';
  const heart = Math.round(148 + Math.sin(elapsed / 4) * 6);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0F1E18',
        overflow: 'hidden',
        zIndex: 60,
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {route.geometry && route.origin && route.destination ? (
          <Map origin={route.origin} destination={route.destination} route={route.geometry} />
        ) : (
          <MapPlaceholder
            seed={route.seed}
            width={400}
            height={900}
            variant="live"
            pulse
            progress={Math.min(1, elapsed / 1200)}
          />
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 'max(20px, env(safe-area-inset-top))',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            padding: '10px 24px',
            borderRadius: 999,
            background: 'rgba(15,30,24,0.7)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: 32,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 0.5,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {fmt(elapsed)}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 'calc(max(20px, env(safe-area-inset-top)) + 64px)',
          left: 16,
          right: 16,
          zIndex: 5,
          transform: `translateY(${showBanner ? 0 : -10}px)`,
          opacity: showBanner ? 1 : 0,
          transition: 'all 0.4s',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 14,
            background: 'rgba(255,107,71,0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 6px 18px rgba(255,107,71,0.4)',
          }}
        >
          <Zap size={14} fill="#fff" strokeWidth={0} />
          You&apos;re 12 sec ahead of target pace
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 16,
          top: 'calc(max(20px, env(safe-area-inset-top)) + 170px)',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <FAB onClick={() => setPaused((p) => !p)}>
          {paused ? <Play size={20} fill={C.ink} strokeWidth={0} /> : <Pause size={20} fill={C.ink} strokeWidth={0} />}
        </FAB>
        <FAB sparkle>
          <RotateCcw size={18} color={C.ink} strokeWidth={2.3} />
        </FAB>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 6,
          background: '#fff',
          borderRadius: '28px 28px 0 0',
          padding: '10px 20px max(32px, env(safe-area-inset-bottom))',
          boxShadow: '0 -12px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'block', width: '100%', textAlign: 'center', padding: '6px 0 12px' }}>
          <div style={{ width: 38, height: 5, borderRadius: 3, background: C.ink20, margin: '0 auto' }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            borderRadius: 16,
            background: C.bg,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: C.forest,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CornerUpRight size={20} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                color: C.ink60,
                fontWeight: 600,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
              }}
            >
              In 240 m
            </div>
            <div style={{ fontSize: 15, color: C.ink, fontWeight: 600, letterSpacing: -0.2, marginTop: 1 }}>
              Right onto Broadway Market
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
          <BigStat label="Distance" value={distanceKm.toFixed(2)} unit="km" />
          <BigStat label="Pace" value={paceStr} unit={`/km · avg 5:14`} divider />
          <BigStat label="Heart" value={heart} unit="bpm" divider />
        </div>

        <button
          onClick={() => onFinish({ elapsedSeconds: elapsed, distanceKm })}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 16,
            width: '100%',
            boxSizing: 'border-box',
            padding: '15px',
            borderRadius: 16,
            background: C.ink,
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          <Flag size={16} strokeWidth={2.4} />
          Finish run
        </button>
      </div>
    </div>
  );
}

function FAB({ children, onClick, sparkle }: { children: React.ReactNode; onClick?: () => void; sparkle?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        width: 52,
        height: 52,
        borderRadius: 26,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 20px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
        position: 'relative',
      }}
    >
      {children}
      {sparkle && (
        <div
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            width: 18,
            height: 18,
            borderRadius: 9,
            background: C.coral,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff',
          }}
        >
          <Sparkles size={9} color="#fff" strokeWidth={3} fill="#fff" />
        </div>
      )}
    </button>
  );
}
