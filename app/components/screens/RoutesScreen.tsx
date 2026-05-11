'use client';

import { ChevronLeft, Heart, Play, Sparkles } from 'lucide-react';
import MapPlaceholder from '../MapPlaceholder';
import { C } from '../../lib/tokens';
import { Divider, Stat } from './shared';
import type { GeneratedRoute } from '../../lib/screen-state';

interface Props {
  routes: GeneratedRoute[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onStart: (route: GeneratedRoute) => void;
}

export default function RoutesScreen({ routes, loading, error, onBack, onStart }: Props) {
  return (
    <div style={{ paddingBottom: 30, paddingTop: 4 }}>
      <div style={{ padding: '14px 20px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
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
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 9px',
              borderRadius: 999,
              background: C.sage,
              color: C.forest,
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            <Sparkles size={10} strokeWidth={2.6} />
            Powered by Claude
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: -0.5, lineHeight: 1.1 }}>
            {loading ? 'Designing your routes…' : `${routes.length} route${routes.length === 1 ? '' : 's'} for you`}
          </div>
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

      {loading && (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <RouteCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {routes.map((r, i) => (
            <div
              key={r.id}
              style={{
                background: '#fff',
                borderRadius: 22,
                overflow: 'hidden',
                border: `1px solid ${r.isRecommended ? 'rgba(255,107,71,0.4)' : C.ink08}`,
                position: 'relative',
              }}
            >
              {r.isRecommended && (
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    zIndex: 2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 999,
                    background: C.coral,
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    textTransform: 'uppercase',
                  }}
                >
                  <Sparkles size={10} strokeWidth={2.6} fill="#fff" />
                  Top pick
                </div>
              )}
              <div
                style={{
                  padding: '16px 18px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.ink60,
                      fontWeight: 600,
                      letterSpacing: 0.3,
                      textTransform: 'uppercase',
                    }}
                  >
                    Option {i + 1}
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: C.ink, letterSpacing: -0.4, marginTop: 2 }}>
                    {r.name}
                  </div>
                </div>
                {!r.isRecommended && (
                  <button
                    aria-label="Save"
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      background: C.bg,
                      border: `1px solid ${C.ink08}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Heart size={14} color={C.ink60} />
                  </button>
                )}
              </div>
              <div style={{ height: 122, background: C.sage }}>
                <MapPlaceholder seed={r.seed} width={335} height={122} />
              </div>
              <div style={{ padding: '12px 18px 0', display: 'flex', justifyContent: 'space-between' }}>
                <Stat label="Distance" value={`${(r.distanceMeters / 1000).toFixed(1)} km`} />
                <Divider />
                <Stat label="Time" value={`${Math.round(r.durationSeconds / 60)} min`} />
                <Divider />
                <Stat label="Elev" value={`+${r.elevationMeters} m`} />
                <Divider />
                <Stat label="Off-road" value={`${r.offroadPct}%`} />
              </div>
              <div
                style={{
                  margin: '14px 18px',
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: C.bg,
                  color: C.ink,
                  fontSize: 13,
                  fontStyle: 'italic',
                  lineHeight: 1.45,
                  borderLeft: `3px solid ${C.coral}`,
                }}
              >
                “{r.rationale}”
              </div>
              <div style={{ padding: '0 18px 18px', display: 'flex', gap: 8 }}>
                <button
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    flex: 1,
                    textAlign: 'center',
                    padding: '13px',
                    borderRadius: 14,
                    border: `1.5px solid ${C.ink20}`,
                    color: C.ink,
                    fontSize: 14,
                    fontWeight: 600,
                    boxSizing: 'border-box',
                  }}
                >
                  Preview
                </button>
                <button
                  onClick={() => onStart(r)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    flex: 1.4,
                    textAlign: 'center',
                    padding: '13px',
                    borderRadius: 14,
                    background: C.coral,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 6px 14px rgba(255,107,71,0.32)',
                    boxSizing: 'border-box',
                  }}
                >
                  <Play size={14} fill="#fff" strokeWidth={0} />
                  Start run
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RouteCardSkeleton() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 22,
        overflow: 'hidden',
        border: `1px solid ${C.ink08}`,
      }}
    >
      <div style={{ padding: '16px 18px 12px' }}>
        <ShimmerBar width={64} height={10} />
        <div style={{ height: 6 }} />
        <ShimmerBar width={180} height={20} />
      </div>
      <div style={{ height: 122, background: C.sage, opacity: 0.6 }} />
      <div style={{ padding: '14px 18px 18px' }}>
        <ShimmerBar width="100%" height={12} />
        <div style={{ height: 6 }} />
        <ShimmerBar width="60%" height={12} />
      </div>
    </div>
  );
}

function ShimmerBar({ width, height }: { width: number | string; height: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: height / 2,
        background: `linear-gradient(90deg, ${C.ink08} 0%, ${C.ink20} 50%, ${C.ink08} 100%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s linear infinite',
      }}
    />
  );
}
