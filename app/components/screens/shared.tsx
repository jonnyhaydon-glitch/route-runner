import { C } from '../../lib/tokens';

export function Stat({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: dark ? 'rgba(255,255,255,0.55)' : C.ink60,
          fontWeight: 500,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: dark ? '#fff' : C.ink,
          letterSpacing: -0.2,
          fontVariantNumeric: 'tabular-nums',
          marginTop: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function Divider({ dark }: { dark?: boolean }) {
  return <div style={{ width: 1, height: 22, background: dark ? 'rgba(255,255,255,0.15)' : C.ink20 }} />;
}

export function ThinkingDots() {
  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: '#fff',
            animation: `thinkPulse 1.2s ${i * 0.15}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}

export function BigStat({
  label,
  value,
  unit,
  divider,
}: {
  label: string;
  value: string | number;
  unit: string;
  divider?: boolean;
}) {
  return (
    <div
      style={{
        padding: '4px 0',
        textAlign: 'center',
        borderLeft: divider ? `1px solid ${C.ink08}` : 'none',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: C.ink60,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: C.ink,
          letterSpacing: -0.8,
          fontVariantNumeric: 'tabular-nums',
          marginTop: 2,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10, color: C.ink40, marginTop: 1 }}>{unit}</div>
    </div>
  );
}

export function SummaryStat({
  label,
  value,
  unit,
  small,
}: {
  label: string;
  value: string;
  unit: string;
  small?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.6)',
          fontWeight: 600,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <span
          style={{
            fontSize: small ? 22 : 28,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: -0.6,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{unit}</span>
      </div>
    </div>
  );
}
