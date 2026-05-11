'use client';

import { useRef, useState } from 'react';
import { Check, ChevronLeft, MapPin, Navigation, Sparkles } from 'lucide-react';
import DestinationSearch from '../DestinationSearch';
import { C } from '../../lib/tokens';
import { ThinkingDots } from './shared';
import {
  DesignParams,
  MOOD_OPTIONS,
  PACE_OPTIONS,
  PREF_LIST,
  PaceId,
  defaultDesignParams,
} from '../../lib/screen-state';
import type { GeocodeResult } from '../../lib/mapbox';

interface Props {
  initial?: DesignParams;
  onBack: () => void;
  onGenerate: (params: DesignParams) => Promise<void> | void;
}

export default function DesignScreen({ initial, onBack, onGenerate }: Props) {
  const [params, setParams] = useState<DesignParams>(initial ?? defaultDesignParams());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDistance = (v: number) => setParams((p) => ({ ...p, distance: v }));
  const setPace = (v: PaceId) => setParams((p) => ({ ...p, pace: v }));
  const setMood = (v: DesignParams['mood']) => setParams((p) => ({ ...p, mood: v }));
  const togglePref = (k: string) =>
    setParams((p) => ({ ...p, prefs: { ...p.prefs, [k]: !p.prefs[k] } }));
  const setDestination = (d: GeocodeResult | null) => setParams((p) => ({ ...p, destination: d }));

  const triggerGen = async () => {
    setError(null);
    setGenerating(true);
    try {
      await onGenerate(params);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ paddingBottom: 130, position: 'relative' }}>
      <div style={{ padding: '14px 20px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          aria-label="Back"
          style={{
            all: 'unset',
            cursor: 'pointer',
            width: 36,
            height: 36,
            borderRadius: 18,
            background: '#fff',
            border: `1px solid ${C.ink08}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={20} color={C.ink} />
        </button>
        <div>
          <div style={{ fontSize: 12, color: C.ink60, fontWeight: 500, letterSpacing: 0.2, textTransform: 'uppercase' }}>
            STEP 1 OF 2
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: -0.5, lineHeight: 1.1, marginTop: 1 }}>
            Design your run
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <Label>Distance</Label>
          <div style={{ fontSize: 12, color: C.ink60 }}>est. {Math.round(params.distance * 5.6)} min</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: '18px 18px 22px', border: `1px solid ${C.ink08}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
            <span
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: C.ink,
                letterSpacing: -1.5,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {params.distance.toFixed(1)}
            </span>
            <span style={{ fontSize: 20, fontWeight: 500, color: C.ink60 }}>km</span>
          </div>
          <CustomSlider value={params.distance} min={1} max={20} step={0.5} onChange={setDistance} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: C.ink40,
              marginTop: 8,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>1 km</span>
            <span>10 km</span>
            <span>20 km</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <Label style={{ marginBottom: 8 }}>Pace</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {PACE_OPTIONS.map((p) => {
            const on = params.pace === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPace(p.id)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '10px 4px',
                  borderRadius: 14,
                  background: on ? C.ink : '#fff',
                  border: `1px solid ${on ? C.ink : C.ink08}`,
                }}
              >
                <div style={{ fontSize: 12, color: on ? 'rgba(255,255,255,0.6)' : C.ink60, fontWeight: 500 }}>{p.label}</div>
                <div
                  style={{
                    fontSize: 14,
                    color: on ? '#fff' : C.ink,
                    fontWeight: 700,
                    marginTop: 2,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {p.val}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <Label style={{ marginBottom: 8 }}>Start &amp; End</Label>
        <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.ink08}`, overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderBottom: `1px solid ${C.ink08}`,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                background: C.sage,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 4, background: C.forest }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: C.ink60, fontWeight: 500 }}>From</div>
              <div style={{ fontSize: 15, color: C.ink, fontWeight: 500 }}>Current location</div>
            </div>
            <Navigation size={16} color={C.ink40} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                background: 'rgba(255,107,71,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MapPin size={14} color={C.coral} strokeWidth={2.6} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: C.ink60, fontWeight: 500, marginBottom: 2 }}>To (optional)</div>
              <DestinationSearch
                onSelect={setDestination}
                placeholder="Anywhere — let Claude choose"
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <Label style={{ marginBottom: 8 }}>Preferences</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {PREF_LIST.map((p) => {
            const on = params.prefs[p];
            return (
              <button
                key={p}
                onClick={() => togglePref(p)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  padding: '8px 13px',
                  borderRadius: 999,
                  background: on ? 'rgba(255,107,71,0.12)' : '#fff',
                  color: on ? C.coralDeep : C.ink,
                  border: `1px solid ${on ? 'rgba(255,107,71,0.4)' : C.ink20}`,
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {on && <Check size={12} strokeWidth={3} />}
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <Label style={{ marginBottom: 8 }}>
          Mood <span style={{ textTransform: 'none', color: C.ink40, fontWeight: 500 }}>· optional</span>
        </Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
          {MOOD_OPTIONS.map((m) => {
            const on = params.mood === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMood(on ? null : m.id)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '12px 8px',
                  borderRadius: 14,
                  background: on ? C.forest : '#fff',
                  color: on ? '#fff' : C.ink,
                  border: `1px solid ${on ? C.forest : C.ink08}`,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div style={{ padding: '0 20px 16px' }}>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: 'rgba(255,107,71,0.1)',
              color: C.coralDeep,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          bottom: 88,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          padding: '14px 20px 14px',
          background: `linear-gradient(180deg, rgba(250,247,242,0) 0%, ${C.bg} 30%)`,
          zIndex: 25,
          boxSizing: 'border-box',
        }}
      >
        <button
          onClick={triggerGen}
          disabled={generating}
          style={{
            all: 'unset',
            cursor: generating ? 'wait' : 'pointer',
            width: '100%',
            boxSizing: 'border-box',
            padding: '17px',
            borderRadius: 18,
            background: generating ? C.forest : C.coral,
            color: '#fff',
            textAlign: 'center',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: -0.1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            boxShadow: generating ? 'none' : '0 8px 20px rgba(255,107,71,0.35)',
            transition: 'all 0.3s',
          }}
        >
          {generating ? (
            <>
              <ThinkingDots />
              Claude is designing your run
            </>
          ) : (
            <>
              <Sparkles size={18} strokeWidth={2.4} />
              Generate routes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: C.ink60,
        letterSpacing: 0.2,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CustomSlider({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const trackRef = useRef<HTMLDivElement>(null);

  const apply = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + p * (max - min);
    const stepped = Math.round(raw / step) * step;
    onChange(Math.max(min, Math.min(max, stepped)));
  };

  const onMouse = (e: React.MouseEvent) => {
    apply(e.clientX);
    const move = (ev: MouseEvent) => apply(ev.clientX);
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  const onTouch = (e: React.TouchEvent) => apply(e.touches[0].clientX);

  return (
    <div
      ref={trackRef}
      onMouseDown={onMouse}
      onTouchStart={onTouch}
      onTouchMove={onTouch}
      style={{
        position: 'relative',
        height: 28,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{ position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3, background: C.sage }} />
      <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 6, borderRadius: 3, background: C.coral }} />
      <div
        style={{
          position: 'absolute',
          left: `calc(${pct}% - 12px)`,
          width: 24,
          height: 24,
          borderRadius: 12,
          background: '#fff',
          border: `3px solid ${C.coral}`,
          boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
        }}
      />
    </div>
  );
}
