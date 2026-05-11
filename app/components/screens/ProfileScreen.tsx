'use client';

import { Activity, ChevronRight, Settings, Trophy, Volume2 } from 'lucide-react';
import { C } from '../../lib/tokens';

const STATS = [
  ['Week', '24.6 km'],
  ['Month', '108 km'],
  ['Streak', '12 days'],
] as const;

const ROWS = [
  ['Goals & training', Trophy],
  ['Connected services', Activity],
  ['Notifications', Volume2],
  ['Settings', Settings],
] as const;

export default function ProfileScreen() {
  return (
    <div style={{ padding: '20px 20px 110px' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.ink, letterSpacing: -0.6, marginBottom: 18 }}>Profile</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            background: `linear-gradient(135deg, ${C.forest}, #2D5240)`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          AB
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>Alex Bennett</div>
          <div style={{ fontSize: 13, color: C.ink60 }}>London · 142 runs this year</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {STATS.map(([l, v]) => (
          <div
            key={l}
            style={{
              padding: '14px 10px',
              borderRadius: 14,
              background: '#fff',
              border: `1px solid ${C.ink08}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: C.ink60,
                fontWeight: 600,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}
            >
              {l}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.ink,
                marginTop: 3,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.ink08}` }}>
        {ROWS.map(([label, Icon], i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderBottom: i < ROWS.length - 1 ? `1px solid ${C.ink08}` : 'none',
            }}
          >
            <Icon size={18} color={C.forest} />
            <div style={{ flex: 1, fontSize: 15, color: C.ink, fontWeight: 500 }}>{label}</div>
            <ChevronRight size={16} color={C.ink40} />
          </div>
        ))}
      </div>
    </div>
  );
}
