'use client';

import { Heart } from 'lucide-react';
import MapPlaceholder from '../MapPlaceholder';
import { C } from '../../lib/tokens';

const ITEMS = [
  { name: 'Marshes Sunday Long', dist: '14.2 km', seed: 9, surf: 'Towpath' },
  { name: 'Tempo to Brockwell', dist: '7.0 km', seed: 71, surf: 'Tarmac' },
  { name: 'Recovery Loop', dist: '3.4 km', seed: 55, surf: 'Tarmac' },
];

export default function SavedScreen() {
  return (
    <div style={{ padding: '20px 20px 110px' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.ink, letterSpacing: -0.6, marginBottom: 14 }}>Saved</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ITEMS.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              padding: 12,
              borderRadius: 18,
              background: '#fff',
              border: `1px solid ${C.ink08}`,
              alignItems: 'center',
            }}
          >
            <div style={{ width: 70, height: 70, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
              <MapPlaceholder seed={r.seed} width={70} height={70} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{r.name}</div>
              <div style={{ fontSize: 12, color: C.ink60, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                {r.dist} · {r.surf}
              </div>
            </div>
            <Heart size={16} fill={C.coral} stroke={C.coral} />
          </div>
        ))}
      </div>
    </div>
  );
}
