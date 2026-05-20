import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { buildSchedule } from '../../debate-loop/schedule';
import { useDebateStore } from '../../store/debateStore';
import type { AgentId, ScoreAxes, Turn } from '../../types';
import {
  ACCENT,
  INK,
  MUTED,
  Note,
  PAPER,
  ROYAL,
  ScoreBar,
  TEAL,
} from './primitives';

// Mapping label IT ↔ campi storeABBINATO
const AXES_KEYS: Array<keyof ScoreAxes> = ['logical', 'sources', 'data', 'counter'];
const AXIS_LABEL: Record<keyof ScoreAxes, string> = {
  logical: 'logica',
  sources: 'fonti',
  data: 'dati',
  counter: 'replica',
};
const AXIS_HINT: Record<keyof ScoreAxes, string> = {
  logical: 'coerenza interna · struttura argomentativa · assenza di fallacie',
  sources: 'autorevolezza e pertinenza delle citazioni',
  data: 'evidenza empirica · uso di numeri verificabili',
  counter: "efficacia nel rispondere all'avversario · attacchi pertinenti",
};

function sumAxes(s: ScoreAxes): number {
  return s.logical + s.sources + s.data + s.counter;
}

export function Scoreboard({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const cum = useDebateStore((s) => s.cumulativeScore);
  const commentary = useDebateStore((s) => s.latestCommentary);
  const turns = useDebateStore(useShallow((s) => s.turns));
  const activeSchedule = useDebateStore(useShallow((s) => s.activeSchedule));
  const confrontoRounds = useDebateStore((s) => s.confrontoRounds);
  const verdict = useDebateStore((s) => s.verdict);

  const { maxPerAxis, maxTotal } = useMemo(() => {
    const schedule = activeSchedule.length > 0 ? activeSchedule : buildSchedule(confrontoRounds);
    const turnsPerAgent = schedule.length / 2;
    // Ogni turno il giudice assegna fino a 10 punti per asse (vedi judgeRunner).
    const max = turnsPerAgent * 10;
    return { maxPerAxis: max, maxTotal: max * 4 };
  }, [activeSchedule, confrontoRounds]);

  const optTotal = sumAxes(cum.optimist);
  const skpTotal = sumAxes(cum.skeptic);
  const leader: AgentId | 'tie' =
    optTotal === skpTotal ? 'tie' : optTotal > skpTotal ? 'optimist' : 'skeptic';
  const diff = Math.abs(optTotal - skpTotal);

  if (open) {
    return (
      <div
        style={{
          position: 'absolute',
          left: 36,
          right: 36,
          bottom: 24,
          zIndex: 5,
          background: PAPER,
          border: `1.8px solid ${INK}`,
          borderRadius: 10,
          padding: '14px 18px 14px',
          boxShadow: '0 -6px 20px rgba(0,0,0,0.06)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1.1fr',
          gap: 20,
          maxHeight: '58vh',
          overflow: 'hidden',
        }}
      >
        <AgentDetail
          agentLabel="OTTIMISTA"
          color={TEAL}
          score={cum.optimist}
          opponentScore={cum.skeptic}
          total={optTotal}
          maxPerAxis={maxPerAxis}
          turns={turns}
          agent="optimist"
        />

        <div
          style={{
            borderLeft: `1px solid ${INK}30`,
            borderRight: `1px solid ${INK}30`,
            padding: '0 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minWidth: 0,
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Note color={ACCENT}>commento del giudice</Note>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Patrick Hand', cursive",
                fontSize: 14,
                color: MUTED,
              }}
            >
              chiudi ▾
            </button>
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: 17,
              lineHeight: 1.4,
            }}
          >
            {commentary
              ? `"${commentary}"`
              : verdict
                ? `"${verdict.reasoning}"`
                : '"In attesa della prima valutazione del giudice…"'}
          </div>
          <div
            style={{
              marginTop: 6,
              padding: '10px 12px',
              border: `1.5px dashed ${INK}`,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.4)',
            }}
          >
            <Note>verdetto {verdict ? 'finale' : 'live'}</Note>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginTop: 3,
              }}
            >
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: 18,
                  color: leader === 'optimist' ? TEAL : leader === 'skeptic' ? ROYAL : INK,
                }}
              >
                {leader === 'tie'
                  ? 'Pareggio'
                  : leader === 'optimist'
                    ? "L'Ottimista Tech"
                    : 'Lo Scettico Critico'}
              </span>
              <span
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: 18,
                  color: leader === 'optimist' ? TEAL : leader === 'skeptic' ? ROYAL : INK,
                }}
              >
                {leader === 'tie' ? '=' : `+${diff} ↑`}
              </span>
            </div>
          </div>
          <Note style={{ marginTop: 4 }}>criteri di valutazione</Note>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {AXES_KEYS.map((a) => (
              <div
                key={a}
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  fontSize: 12,
                  lineHeight: 1.3,
                }}
              >
                <span style={{ fontWeight: 700 }}>{AXIS_LABEL[a]}</span>{' '}
                <span style={{ color: '#5a4e42' }}>— {AXIS_HINT[a]}</span>
              </div>
            ))}
          </div>
          <Note style={{ marginTop: 4 }}>massimo per asse · {maxPerAxis} · totale · {maxTotal}</Note>
        </div>

        <AgentDetail
          agentLabel="SCETTICO"
          color={ROYAL}
          score={cum.skeptic}
          opponentScore={cum.optimist}
          total={skpTotal}
          maxPerAxis={maxPerAxis}
          turns={turns}
          agent="skeptic"
        />
      </div>
    );
  }

  // Vista collassata — in-flow (sotto le colonne, niente overlay).
  return (
    <div
      style={{
        flexShrink: 0,
        marginTop: 8,
        borderTop: `1.8px solid ${INK}`,
        paddingTop: 12,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: 24,
        alignItems: 'center',
      }}
    >
      <CollapsedScore
        label="OTTIMISTA"
        color={TEAL}
        total={optTotal}
        max={maxTotal}
        score={cum.optimist}
        onClick={onOpen}
      />
      <button
        onClick={onOpen}
        style={{
          background: 'transparent',
          border: `1.5px dashed ${INK}`,
          borderRadius: 8,
          padding: '8px 14px',
          cursor: 'pointer',
          minWidth: 160,
          textAlign: 'center',
        }}
      >
        <Note>verdetto live · clicca per dettagli</Note>
        <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: 22, marginTop: 2 }}>
          {leader === 'tie' ? (
            <span>= pareggio</span>
          ) : (
            <>
              {leader === 'optimist' ? 'OTT' : 'SCE'}{' '}
              <span style={{ color: leader === 'optimist' ? TEAL : ROYAL }}>+{diff} ↑</span>
            </>
          )}
        </div>
        <Note style={{ marginTop: 2 }}>▸ apri pagella</Note>
      </button>
      <CollapsedScore
        label="SCETTICO"
        color={ROYAL}
        total={skpTotal}
        max={maxTotal}
        score={cum.skeptic}
        onClick={onOpen}
      />
    </div>
  );
}

function CollapsedScore({
  label,
  color,
  total,
  max,
  score,
  onClick,
}: {
  label: string;
  color: string;
  total: number;
  max: number;
  score: ScoreAxes;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: 16, color }}>{label}</span>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 26,
            color,
          }}
        >
          {total}
          <span style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
            {' '}
            / {max}
          </span>
        </span>
      </div>
      <ScoreBar value={total} max={max} color={color} style={{ marginTop: 4, borderColor: color }} />
      <Note color={color} style={{ marginTop: 3 }}>
        L{score.logical} · F{score.sources} · D{score.data} · R{score.counter}
      </Note>
    </button>
  );
}

function AgentDetail({
  agentLabel,
  color,
  score,
  opponentScore,
  total,
  maxPerAxis,
  turns,
  agent,
}: {
  agentLabel: string;
  color: string;
  score: ScoreAxes;
  opponentScore: ScoreAxes;
  total: number;
  maxPerAxis: number;
  turns: ReadonlyArray<Turn>;
  agent: AgentId;
}) {
  const agentTurns = turns.filter((t) => t.agent === agent);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', paddingRight: 6, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: 18, color }}>{agentLabel}</span>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 32,
            lineHeight: 1,
            color,
          }}
        >
          {total}
        </span>
      </div>
      <Note>per asse · 0–{maxPerAxis}</Note>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {AXES_KEYS.map((a) => (
          <div key={a} title={AXIS_HINT[a]}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: "'Patrick Hand', cursive",
                fontSize: 14,
              }}
            >
              <span>{AXIS_LABEL[a]}</span>
              <span style={{ color: score[a] >= opponentScore[a] ? color : INK }}>
                {score[a]}{' '}
                <span style={{ color: MUTED, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                  / {maxPerAxis}
                </span>
              </span>
            </div>
            <ScoreBar value={score[a]} max={maxPerAxis} color={color} style={{ borderColor: color, height: 6, marginTop: 2 }} />
          </div>
        ))}
      </div>
      <Note style={{ marginTop: 4 }}>contributo per turno</Note>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {agentTurns.length === 0 && (
          <Note style={{ fontStyle: 'italic', textTransform: 'none' }}>
            ancora nessun turno valutato.
          </Note>
        )}
        {agentTurns.map((t) => {
          const ev = t.judgeEval?.[agent];
          const sum = ev ? sumAxes(ev) : 0;
          return (
            <details
              key={t.id}
              style={{
                border: `1px solid ${color}30`,
                borderRadius: 6,
                background:
                  agent === 'optimist' ? 'rgba(14,138,122,0.04)' : 'rgba(108,43,217,0.04)',
                padding: '6px 10px',
              }}
            >
              <summary
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  cursor: 'pointer',
                  gap: 8,
                }}
              >
                <span style={{ fontFamily: "'Patrick Hand', cursive", fontSize: 14, color }}>
                  T{t.index + 1}
                </span>
                {ev ? (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#5a4e42' }}>
                    L{ev.logical} · F{ev.sources} · D{ev.data} · R{ev.counter}
                  </span>
                ) : (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: MUTED }}>
                    in attesa…
                  </span>
                )}
                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: 'italic',
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {ev ? `+${sum}` : '—'}
                </span>
              </summary>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  fontSize: 12,
                  lineHeight: 1.35,
                  marginTop: 4,
                  color: '#3a352c',
                }}
              >
                {t.judgeEval?.commentary ? `"${t.judgeEval.commentary}"` : <span style={{ color: MUTED }}>nessun commento</span>}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
