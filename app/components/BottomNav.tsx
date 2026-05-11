'use client';

import { Bookmark, Compass, Play, Sparkles, User } from 'lucide-react';
import { C } from '../lib/tokens';
import type { Tab } from '../lib/screen-state';

interface Props {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onRun: () => void;
}

export default function BottomNav({ tab, onTabChange, onRun }: Props) {
  const items: Array<{ id: Tab; label: string; Icon: typeof Compass }> = [
    { id: 'discover', label: 'Discover', Icon: Compass },
    { id: 'design', label: 'Design', Icon: Sparkles },
  ];
  const rightItems: Array<{ id: Tab; label: string; Icon: typeof Compass }> = [
    { id: 'saved', label: 'Saved', Icon: Bookmark },
    { id: 'profile', label: 'Profile', Icon: User },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        paddingBottom: 'max(22px, env(safe-area-inset-bottom))',
        paddingTop: 8,
        background: C.bg,
        borderTop: `1px solid ${C.ink08}`,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        zIndex: 30,
        boxSizing: 'border-box',
      }}
    >
      {items.map(({ id, label, Icon }) => (
        <NavButton key={id} active={tab === id} label={label} Icon={Icon} onClick={() => onTabChange(id)} />
      ))}
      <button
        onClick={onRun}
        aria-label="Start a run"
        style={{
          all: 'unset',
          cursor: 'pointer',
          width: 58,
          height: 58,
          borderRadius: 29,
          background: C.coral,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -22,
          boxShadow: `0 8px 20px rgba(255,107,71,0.45), 0 0 0 4px ${C.bg}`,
        }}
      >
        <Play size={26} fill="#fff" strokeWidth={0} />
      </button>
      {rightItems.map(({ id, label, Icon }) => (
        <NavButton key={id} active={tab === id} label={label} Icon={Icon} onClick={() => onTabChange(id)} />
      ))}
    </div>
  );
}

function NavButton({
  active,
  label,
  Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  Icon: typeof Compass;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        color: active ? C.forest : C.ink40,
        paddingTop: 4,
        minWidth: 50,
      }}
    >
      <Icon size={22} strokeWidth={active ? 2.4 : 2} />
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 500, letterSpacing: 0.1 }}>{label}</span>
    </button>
  );
}
