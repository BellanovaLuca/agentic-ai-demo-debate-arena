import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { buildSchedule } from '../../debate-loop/schedule';
import { useDebateStore } from '../../store/debateStore';
import type { Phase } from '../../types';
import { AgentLane } from './AgentLane';
import { FullscreenConversation } from './FullscreenConversation';
import { ACCENT, HandUnderline, INK, MUTED, Note, PAPER } from './primitives';
import { Scoreboard } from './Scoreboard';
import { SettingsPill } from './SettingsPill';

const PHASES: Phase[] = ['apertura', 'ricerca', 'confronto', 'chiusura'];
const PHASE_LABEL: Record<Phase, string> = {
  apertura: 'Apertura',
  ricerca: 'Ricerca',
  confronto: 'Confronto',
  chiusura: 'Chiusura',
};

export function DebateLive({
  onNewDebate,
  onInfo,
  onExport,
  onOpenVerdict,
}: {
  onNewDebate: () => void;
  onInfo: () => void;
  onExport: () => void;
  onOpenVerdict: () => void;
}) {
  const config = useDebateStore((s) => s.config);
  const status = useDebateStore((s) => s.status);
  const currentStepIndex = useDebateStore((s) => s.currentStepIndex);
  const isPaused = useDebateStore((s) => s.isPaused);
  const togglePause = useDebateStore((s) => s.togglePause);
  const requestCancel = useDebateStore((s) => s.requestCancel);
  const error = useDebateStore((s) => s.error);
  const activeSchedule = useDebateStore(useShallow((s) => s.activeSchedule));
  const confrontoRounds = useDebateStore((s) => s.confrontoRounds);
  const verdict = useDebateStore((s) => s.verdict);

  const schedule = activeSchedule.length > 0 ? activeSchedule : buildSchedule(confrontoRounds);
  const currentStep = schedule[currentStepIndex];
  const currentPhase: Phase | null = currentStep?.phase ?? null;

  const isRunning = status === 'configuring' || status === 'running' || status === 'paused';

  const [judgeOpen, setJudgeOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // Topic fallback se il config non e' ancora settato (status=configuring).
  const topic = config?.topic ?? '';

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        minHeight: 720,
        background: PAPER,
        color: INK,
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        padding: '24px 36px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* masthead: grid 3 colonne — titolo a sinistra · fasi al centro · controlli a destra */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          borderBottom: `1.8px solid ${INK}`,
          paddingBottom: 10,
          gap: 12,
        }}
      >
        <div style={{ justifySelf: 'start' }}>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: -0.5,
            }}
          >
            Debate&nbsp;Arena
          </div>
        </div>

        {/* phase tracker centrato sopra la linea nera */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifySelf: 'center' }}>
          {PHASES.map((p, i) => {
            const currentIdx = currentPhase ? PHASES.indexOf(currentPhase) : status === 'completed' ? 3 : -1;
            const isActive = i === currentIdx;
            const isPast = i < currentIdx || (status === 'completed' && i <= 3);
            return (
              <div
                key={p}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: 14,
                  color: isActive ? ACCENT : isPast ? INK : MUTED,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isPast ? INK : isActive ? ACCENT : 'transparent',
                    border: `1.5px solid ${isPast || isActive ? INK : MUTED}`,
                  }}
                />
                {PHASE_LABEL[p]}
              </div>
            );
          })}
        </div>

        {/* controlli a destra: settings pill + ? come funziona (ultimo) */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifySelf: 'end', flexWrap: 'wrap' }}>
          <SettingsPill mode="live" currentStepIndex={currentStepIndex} />
          <button
            type="button"
            onClick={onInfo}
            title="Come funziona Debate Arena"
            aria-label="Come funziona Debate Arena"
            style={{
              background: 'transparent',
              border: `1.5px solid ${INK}`,
              borderRadius: 999,
              padding: '4px 12px',
              fontFamily: "'Patrick Hand', cursive",
              fontSize: 13,
              cursor: 'pointer',
              color: INK,
            }}
          >
            ? come funziona
          </button>
        </div>
      </div>

      {/* headline + toolbar laterale: tema a sinistra, controlli compatti a destra
          (stessa riga per recuperare spazio verticale per la conversazione) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 20,
          padding: '8px 0 4px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <Note style={{ marginBottom: 4 }}>
            {status === 'completed'
              ? 'tema · dibattito concluso'
              : status === 'cancelled'
                ? 'tema · dibattito interrotto'
                : status === 'error'
                  ? 'tema · errore'
                  : 'tema · dibattito in corso'}
          </Note>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: 26,
              lineHeight: 1.1,
              letterSpacing: -0.5,
              maxWidth: 1100,
            }}
          >
            "{topic || 'in attesa…'}"
          </div>
          <HandUnderline w={320} color={ACCENT} style={{ marginTop: 2 }} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'flex-end',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {isRunning && (
              <>
                <button
                  type="button"
                  onClick={togglePause}
                  style={smallBtn(INK, false)}
                  title={isPaused ? 'Riprendi il dibattito' : 'Metti in pausa'}
                >
                  {isPaused ? '▶ riprendi' : '⏸ pausa'}
                </button>
                <button
                  type="button"
                  onClick={requestCancel}
                  style={smallBtn(ACCENT, false)}
                  title="Interrompi il dibattito"
                >
                  ⏹ stop
                </button>
              </>
            )}
            <button onClick={onExport} style={smallBtn(INK, false)} title="Esporta JSON">
              ↓ export
            </button>
            <button
              onClick={onNewDebate}
              style={smallBtn(INK, false)}
              title="Torna al setup e inizia un nuovo dibattito"
            >
              ← nuovo dibattito
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {verdict && (
              <button
                onClick={onOpenVerdict}
                style={smallBtn(ACCENT, false)}
                title="Riapri il verdetto del giudice"
              >
                ⚖ verdetto
              </button>
            )}
            <button
              onClick={() => setFullscreenOpen(true)}
              style={smallBtn(INK, false)}
              title="Espandi la conversazione a tutto schermo per una lettura facilitata"
            >
              ⤢ espandi conversazione
            </button>
          </div>
        </div>
      </div>

      {error && status === 'error' && (
        <div
          role="alert"
          style={{
            margin: '4px 0 8px',
            padding: '8px 12px',
            border: `1.5px solid ${ACCENT}`,
            background: `${ACCENT}10`,
            borderRadius: 8,
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            color: ACCENT,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* due colonne — flex:1 prende tutto lo spazio fra l'header e la scoreboard */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.5px 1fr',
          gap: 28,
          paddingTop: 16,
          flex: 1,
          minHeight: 0,
        }}
      >
        <AgentLane agent="optimist" />
        <div style={{ background: INK, opacity: 0.85 }} />
        <AgentLane agent="skeptic" />
      </div>

      {/* scoreboard (collassato o pagella aperta) */}
      <Scoreboard open={judgeOpen} onOpen={() => setJudgeOpen(true)} onClose={() => setJudgeOpen(false)} />

      {/* modal fullscreen della conversazione */}
      <FullscreenConversation
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        topic={topic}
      />
    </div>
  );
}

function smallBtn(color: string, filled: boolean): React.CSSProperties {
  return {
    background: filled ? color : 'transparent',
    color: filled ? '#fff' : color,
    border: `1.5px solid ${color}`,
    borderRadius: 999,
    padding: '4px 12px',
    fontFamily: "'Patrick Hand', cursive",
    fontSize: 13,
    cursor: 'pointer',
  };
}
