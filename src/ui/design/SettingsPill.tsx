import { Fragment, useState } from 'react';

import {
  MAX_CONFRONTO_ROUNDS,
  MIN_CONFRONTO_ROUNDS,
  roundsToTotalTurns,
  totalTurnsToRounds,
} from '../../debate-loop/schedule';
import { useDebateStore } from '../../store/debateStore';
import type { DebateSpeed } from '../../types';
import { ACCENT, INK, Note, PAPER } from './primitives';

const SPEEDS: DebateSpeed[] = [0.25, 0.5, 1, 2, 4];

// Pill rosso in alto a destra che apre il popover con turni e velocita.
// Funziona sia in setup (mostra "8 turni · 1x") sia in live (mostra "tX / N · 1x" con pulse).
export function SettingsPill({
  mode,
  currentStepIndex,
}: {
  mode: 'setup' | 'live';
  currentStepIndex?: number;
}) {
  const speed = useDebateStore((s) => s.speed);
  const confrontoRounds = useDebateStore((s) => s.confrontoRounds);
  const setSpeed = useDebateStore((s) => s.setSpeed);
  const setConfrontoRounds = useDebateStore((s) => s.setConfrontoRounds);
  const status = useDebateStore((s) => s.status);

  const [open, setOpen] = useState(false);

  const totalTurns = roundsToTotalTurns(confrontoRounds);
  const turnOptions: number[] = [];
  for (let r = MIN_CONFRONTO_ROUNDS; r <= MAX_CONFRONTO_ROUNDS; r++) {
    turnOptions.push(roundsToTotalTurns(r));
  }

  // In live, l'utente non deve poter cambiare turni totali a meta dibattito
  // (lo schedule attivo e' gia snapshottato). La velocita resta modificabile.
  const turnsLocked = mode === 'live' && status !== 'idle' && status !== 'completed';

  const liveLabel =
    mode === 'live'
      ? `t${Math.min((currentStepIndex ?? 0) + 1, totalTurns)} / ${totalTurns} · ${speed}x`
      : `${totalTurns} turni · ${speed}x`;

  const pulse = mode === 'live' && status === 'running';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 12px',
          borderRadius: 999,
          border: `1.8px solid ${ACCENT}`,
          background: open ? ACCENT : 'transparent',
          color: open ? '#fff' : ACCENT,
          fontFamily: "'Patrick Hand', cursive",
          fontSize: 15,
          cursor: 'pointer',
          transition: 'background .12s, color .12s',
        }}
        aria-expanded={open}
        aria-label="Impostazioni dibattito"
        title="Impostazioni dibattito"
      >
        <span
          className={pulse ? 'animate-pulse-soft' : ''}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: open ? '#fff' : ACCENT,
          }}
        />
        {liveLabel}
        <span style={{ fontSize: 11, opacity: 0.8, marginLeft: 2 }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <Fragment>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: 31,
              width: 280,
              padding: '14px 16px',
              background: PAPER,
              border: `1.8px solid ${INK}`,
              borderRadius: 10,
              boxShadow: '4px 4px 0 rgba(0,0,0,0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 10,
              }}
            >
              <Note color={ACCENT}>impostazioni dibattito</Note>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: 14,
                  color: '#9b8c7a',
                }}
              >
                chiudi ×
              </button>
            </div>

            <Note style={{ marginBottom: 4 }}>turni totali {turnsLocked ? '· bloccato' : ''}</Note>
            <div
              style={{
                display: 'flex',
                border: `1.5px solid ${INK}`,
                borderRadius: 6,
                overflow: 'hidden',
                marginBottom: 14,
                opacity: turnsLocked ? 0.55 : 1,
              }}
            >
              {turnOptions.map((n, idx) => (
                <button
                  key={n}
                  onClick={() => {
                    if (turnsLocked) return;
                    setConfrontoRounds(totalTurnsToRounds(n));
                  }}
                  disabled={turnsLocked}
                  style={{
                    flex: 1,
                    background: totalTurns === n ? INK : 'transparent',
                    color: totalTurns === n ? PAPER : INK,
                    border: 'none',
                    padding: '5px 0',
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: 14,
                    cursor: turnsLocked ? 'not-allowed' : 'pointer',
                    borderRight: idx !== turnOptions.length - 1 ? `1px solid ${INK}` : 'none',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <Note style={{ marginBottom: 4 }}>velocità</Note>
            <div
              style={{
                display: 'flex',
                border: `1.5px solid ${INK}`,
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              {SPEEDS.map((s, idx) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    flex: 1,
                    background: speed === s ? INK : 'transparent',
                    color: speed === s ? PAPER : INK,
                    border: 'none',
                    padding: '5px 0',
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: 13,
                    cursor: 'pointer',
                    borderRight: idx !== SPEEDS.length - 1 ? `1px solid ${INK}` : 'none',
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
}
