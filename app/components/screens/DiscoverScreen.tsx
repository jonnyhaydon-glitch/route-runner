'use client';

import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Beer,
  CloudRain,
  Coffee,
  Home,
  MapPin,
  Sparkles,
  Trees,
  Users,
} from 'lucide-react';
import MapPlaceholder from '../MapPlaceholder';
import { C } from '../../lib/tokens';
import { Divider, Stat } from './shared';

interface Props {
  onOpenRoute: () => void;
}

const CHIPS = [
  { id: 'cafe', label: 'End at a cafe', Icon: Coffee },
  { id: 'pub', label: 'End at a pub', Icon: Beer },
  { id: 'loop', label: 'Loop me home', Icon: Home },
  { id: 'community', label: 'Community favourites', Icon: Users },
  { id: 'new', label: 'New this week', Icon: Sparkles },
] as const;

const FEED = [
  { name: 'Hackney Marsh Out & Back', dist: '8.4 km', elev: '+24 m', surf: 'Mixed', end: 'park', seed: 41 },
  { name: 'Victoria Park Sprint', dist: '4.1 km', elev: '+12 m', surf: 'Tarmac', end: 'cafe', seed: 17 },
  { name: 'Regent’s Canal Long', dist: '12.0 km', elev: '+8 m', surf: 'Towpath', end: 'pub', seed: 88 },
  { name: 'London Fields Loop', dist: '5.0 km', elev: '+18 m', surf: 'Tarmac', end: 'home', seed: 23 },
];

const END_ICONS = { cafe: Coffee, pub: Beer, home: Home, park: Trees };

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export default function DiscoverScreen({ onOpenRoute }: Props) {
  const [activeChip, setActiveChip] = useState<string>('cafe');

  const dateLabel = useMemo(() => {
    const d = new Date();
    return `${DOW[d.getDay()]} · ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  }, []);

  return (
    <div style={{ paddingBottom: 110 }}>
      <div style={{ padding: '14px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: C.ink60, fontWeight: 500, letterSpacing: 0.2 }}>{dateLabel}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.ink, letterSpacing: -0.6, lineHeight: 1.1, marginTop: 2 }}>
            Morning, Alex
          </div>
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            background: `linear-gradient(135deg, ${C.forest}, #2D5240)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            boxShadow: '0 4px 12px rgba(31,58,46,0.25)',
          }}
        >
          AB
        </div>
      </div>

      <div style={{ padding: '0 20px 14px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 12px 7px 10px',
            borderRadius: 999,
            background: C.sage,
            color: C.forest,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <CloudRain size={15} strokeWidth={2.2} />
          12°C, light rain · Good window 7–9am
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <button
          onClick={onOpenRoute}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            background: C.forest,
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 12px 28px rgba(31,58,46,0.22)',
          }}
        >
          <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={14} color={C.coral} strokeWidth={2.5} />
              <span
                style={{
                  color: '#fff',
                  opacity: 0.85,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}
              >
                Today&apos;s pick for you
              </span>
            </div>
            <ArrowUpRight size={20} color="#fff" opacity={0.7} />
          </div>
          <div style={{ height: 158, position: 'relative' }}>
            <MapPlaceholder seed={101} width={335} height={158} variant="card" />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(180deg, transparent 40%, ${C.forest} 100%)`,
              }}
            />
          </div>
          <div style={{ padding: '4px 18px 18px' }}>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginBottom: 8 }}>
              Riverside to Brew Lab
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Stat label="Distance" value="5.2 km" dark />
              <Divider dark />
              <Stat label="Est. time" value="28 min" dark />
              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255,107,71,0.18)',
                  color: C.coral,
                  padding: '6px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Coffee size={13} strokeWidth={2.4} />
                Brew Lab
              </div>
            </div>
          </div>
        </button>
      </div>

      <div
        className="scroll-hidden"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '0 20px 18px',
        }}
      >
        {CHIPS.map(({ id, label, Icon }) => {
          const on = activeChip === id;
          return (
            <button
              key={id}
              onClick={() => setActiveChip(id)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 999,
                background: on ? C.ink : '#fff',
                color: on ? '#fff' : C.ink,
                border: `1px solid ${on ? C.ink : C.ink20}`,
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              <Icon size={14} strokeWidth={2.2} />
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, letterSpacing: -0.3 }}>Nearby &amp; saved</div>
          <div style={{ fontSize: 13, color: C.forest, fontWeight: 600 }}>See all</div>
        </div>
        {FEED.map((r, i) => {
          const EndI = END_ICONS[r.end as keyof typeof END_ICONS] ?? MapPin;
          return (
            <button
              key={i}
              onClick={onOpenRoute}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'flex',
                gap: 14,
                padding: 12,
                borderRadius: 20,
                background: '#fff',
                border: `1px solid ${C.ink08}`,
                alignItems: 'center',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: 84, height: 84, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
                <MapPlaceholder seed={r.seed} width={84} height={84} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, letterSpacing: -0.2, marginBottom: 6 }}>
                  {r.name}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 12,
                    color: C.ink60,
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontWeight: 600, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{r.dist}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.elev}</span>
                  <span>· {r.surf}</span>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: C.sage,
                    fontSize: 11,
                    color: C.forest,
                    fontWeight: 600,
                  }}
                >
                  <EndI size={11} strokeWidth={2.4} />
                  Ends at {r.end}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
