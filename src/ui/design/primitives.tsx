import type { CSSProperties, ReactNode } from 'react';

export const PAPER = '#f5f1e8';
export const INK = '#1b1a17';
export const MUTED = '#9b8c7a';
export const TEAL = '#0e8a7a';
export const ROYAL = '#6c2bd9';
export const ACCENT = '#c1361d';

export function Note({
  children,
  style,
  color = MUTED,
}: {
  children: ReactNode;
  style?: CSSProperties;
  color?: string;
}) {
  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  color = INK,
  bg = 'transparent',
  style,
}: {
  children: ReactNode;
  color?: string;
  bg?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        border: `1.5px solid ${color}`,
        borderRadius: 999,
        fontFamily: "'Patrick Hand', cursive",
        fontSize: 14,
        color,
        background: bg,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function HandUnderline({
  w = 200,
  color = ACCENT,
  thickness = 3,
  style,
}: {
  w?: number;
  color?: string;
  thickness?: number;
  style?: CSSProperties;
}) {
  return (
    <svg width={w} height={10} style={{ display: 'block', ...style }}>
      <path
        d={`M 2 6 Q ${w * 0.25} 1 ${w * 0.5} 5 T ${w - 2} 4`}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ScoreBar({
  value = 50,
  max = 100,
  color = INK,
  height = 6,
  style,
}: {
  value?: number;
  max?: number;
  color?: string;
  height?: number;
  style?: CSSProperties;
}) {
  const pct = Math.max(0, Math.min(100, max === 0 ? 0 : (value / max) * 100));
  return (
    <div
      style={{
        position: 'relative',
        height,
        border: `1.5px solid ${color}`,
        borderRadius: 999,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: `${pct}%`,
          background: color,
          transition: 'width 320ms ease-out',
        }}
      />
    </div>
  );
}

export function AvatarOpt({ size = 48, ring = TEAL }: { size?: number; ring?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={{ display: 'block' }}>
      <circle cx="22" cy="22" r="20" fill="#fff" stroke={ring} strokeWidth="2" />
      <path d="M14 30 L22 12 L30 30 Z" fill="none" stroke={ring} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="22" cy="22" r="2.2" fill={ring} />
      <path d="M14 32 Q22 35 30 32" fill="none" stroke={ring} strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function AvatarSkp({ size = 48, ring = ROYAL }: { size?: number; ring?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={{ display: 'block' }}>
      <circle cx="22" cy="22" r="20" fill="#fff" stroke={ring} strokeWidth="2" />
      <circle cx="19" cy="20" r="7" fill="none" stroke={ring} strokeWidth="2" />
      <line x1="24" y1="25" x2="31" y2="32" stroke={ring} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="16" y1="20" x2="22" y2="20" stroke={ring} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Tab({
  active,
  label,
  count,
  color,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? color : 'transparent',
        color: active ? '#fff' : color,
        border: `1.5px solid ${color}`,
        padding: '3px 10px',
        borderRadius: 999,
        fontFamily: "'Patrick Hand', cursive",
        fontSize: 13,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'background .12s, color .12s',
      }}
    >
      {label}
      {typeof count === 'number' && <span style={{ opacity: 0.8, fontSize: 11 }}>{count}</span>}
    </button>
  );
}
