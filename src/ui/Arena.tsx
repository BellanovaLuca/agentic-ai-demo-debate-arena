import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useDebateStore } from '../store/debateStore';
import { buildSchedule } from '../debate-loop/schedule';
import type { AgentId, ChartSpec, Phase, Turn } from '../types';
import { AGENTS } from '../types';
import { ChartCard } from './ChartCard';

const PHASE_LABEL: Record<Phase, string> = {
  apertura: 'Apertura',
  ricerca: 'Ricerca',
  confronto: 'Confronto',
  chiusura: 'Chiusura',
};

const PHASE_ACCENT: Record<Phase, { chip: string; bar: string; dot: string }> = {
  apertura: {
    chip: 'border-sky-500/40 text-sky-300 bg-sky-500/10',
    bar: 'bg-sky-500',
    dot: 'bg-sky-400',
  },
  ricerca: {
    chip: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-400',
  },
  confronto: {
    chip: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
    bar: 'bg-amber-500',
    dot: 'bg-amber-400',
  },
  chiusura: {
    chip: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
    bar: 'bg-rose-500',
    dot: 'bg-rose-400',
  },
};

interface ArenaProps {
  expanded: boolean;
  onToggleExpand: () => void;
}

export function Arena({ expanded, onToggleExpand }: ArenaProps) {
  const turns = useDebateStore((s) => s.turns);
  const config = useDebateStore((s) => s.config);
  const status = useDebateStore((s) => s.status);
  const currentStepIndex = useDebateStore((s) => s.currentStepIndex);
  const isPaused = useDebateStore((s) => s.isPaused);
  const liveSpeech = useDebateStore(useShallow((s) => s.liveSpeech));
  const chartsById = useDebateStore(useShallow((s) => s.chartsById));
  const activeSchedule = useDebateStore(useShallow((s) => s.activeSchedule));
  const confrontoRounds = useDebateStore((s) => s.confrontoRounds);
  const togglePause = useDebateStore((s) => s.togglePause);
  const requestCancel = useDebateStore((s) => s.requestCancel);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const isRunning =
    status === 'configuring' || status === 'running' || status === 'paused';

  const schedule =
    activeSchedule.length > 0 ? activeSchedule : buildSchedule(confrontoRounds);
  const totalTurns = schedule.length;
  const currentStep = schedule[currentStepIndex];
  const currentPhase: Phase | null = currentStep?.phase ?? null;
  const currentAgent: AgentId | null = currentStep?.agent ?? null;

  const orphanCharts = useMemo<ChartSpec[]>(() => {
    const attributed = new Set<string>();
    for (const t of turns) for (const id of t.chartsCreated) attributed.add(id);
    return Object.values(chartsById)
      .filter((c) => !attributed.has(c.id))
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [chartsById, turns]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns.length, liveSpeech.optimist, liveSpeech.skeptic]);

  // Stato testuale e percentuale di progresso.
  const completedTurns =
    status === 'completed' ? totalTurns : Math.min(currentStepIndex, totalTurns);
  const progressPct = totalTurns > 0 ? (completedTurns / totalTurns) * 100 : 0;
  const accent = currentPhase
    ? PHASE_ACCENT[currentPhase]
    : { chip: 'border-slate-500/40 text-slate-300 bg-slate-500/10', bar: 'bg-slate-500', dot: 'bg-slate-400' };

  const statusText = currentPhase
    ? `${PHASE_LABEL[currentPhase]} · turno ${Math.min(currentStepIndex + 1, totalTurns)} di ${totalTurns}`
    : status === 'completed'
      ? 'Dibattito concluso'
      : status === 'cancelled'
        ? 'Dibattito interrotto'
        : status === 'configuring'
          ? 'Configurazione in corso…'
          : 'In attesa di START';

  return (
    <main className="panel flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header dell'Arena: titolo + stato + espandi */}
      <div className="shrink-0 border-b border-white/5 px-5 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold tracking-tight text-slate-100">
              Arena
            </h2>
            <span className={`chip ${accent.chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
              {statusText}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* In modalita' espansa l'header globale e' nascosto: portiamo
                Pausa/Stop qui cosi l'utente non perde il controllo del
                playback senza dover comprimere. */}
            {expanded && isRunning && (
              <>
                <button
                  type="button"
                  onClick={togglePause}
                  className="rounded-md border border-arena-border bg-arena-bg/50 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-white/5"
                  title={isPaused ? 'Riprendi il dibattito' : 'Metti in pausa'}
                >
                  {isPaused ? '▶ Riprendi' : '⏸ Pausa'}
                </button>
                <button
                  type="button"
                  onClick={requestCancel}
                  className="rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300 transition-colors hover:bg-red-500/20"
                  title="Interrompi il dibattito"
                >
                  ⏹ Stop
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onToggleExpand}
              className="rounded-md border border-arena-border bg-arena-bg/50 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-white/5"
              title={expanded ? 'Comprimi: torna alla vista a 3 colonne' : 'Espandi: nasconde colonne e giudice'}
              aria-pressed={expanded}
            >
              {expanded ? '⤡ Comprimi' : '⤢ Espandi'}
            </button>
          </div>
        </div>

        {/* Progress bar sopra le fasi */}
        <div className="mt-3">
          <div
            className="relative h-1 overflow-hidden rounded-full bg-arena-bg"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={totalTurns}
            aria-valuenow={completedTurns}
            aria-label={`Progresso dibattito: ${completedTurns} di ${totalTurns} turni`}
          >
            <motion.div
              className={`h-full ${accent.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[9.5px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span>Apertura</span>
            <span>Ricerca</span>
            <span>Confronto</span>
            <span>Chiusura</span>
          </div>
        </div>
      </div>

      {/* Card del tema */}
      {config && (
        <div className="shrink-0 border-b border-white/5 bg-gradient-to-r from-optimist-500/5 via-transparent to-skeptic-500/5 px-5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Tema del dibattito
          </div>
          <p className="mt-1 font-display text-base leading-snug text-slate-100">
            &ldquo;{config.topic}&rdquo;
          </p>
        </div>
      )}

      {/* Stream dei turni — area scrollabile principale */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 min-h-0"
      >
        {turns.length === 0 && !liveSpeech.optimist && !liveSpeech.skeptic && (
          <div className="m-auto flex max-w-md flex-col items-center gap-3 text-center text-slate-500">
            <div aria-hidden="true" className="text-6xl">🎙️</div>
            <h3 className="font-display text-lg text-slate-200">
              Pronto a iniziare?
            </h3>
            <p className="text-sm leading-relaxed">
              Inserisci un tema e premi <span className="font-semibold text-slate-300">START</span>. Le posizioni
              verranno assegnate automaticamente; poi i due agenti si
              confronteranno attraverso le fasi <em>apertura → ricerca →
              confronto → chiusura</em>.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {turns.map((t) => (
            <SpeechBubble
              key={t.id}
              turn={t}
              charts={t.chartsCreated
                .map((id) => chartsById[id])
                .filter((c): c is ChartSpec => Boolean(c))}
            />
          ))}
        </AnimatePresence>

        {currentAgent &&
          (liveSpeech[currentAgent]?.length ?? 0) > 0 &&
          turns.length === currentStepIndex && (
            <SpeechBubble
              key={`live-${currentAgent}`}
              turn={{
                id: 'live',
                index: currentStepIndex,
                phase: currentPhase ?? 'apertura',
                agent: currentAgent,
                thinking: '',
                speech: liveSpeech[currentAgent] || '',
                toolCalls: [],
                citationsCollected: [],
                chartsCreated: [],
                judgeEval: null,
                createdAt: Date.now(),
              }}
              charts={[]}
              streaming
            />
          )}

        {orphanCharts.length > 0 && (
          <section className="mt-2 rounded-xl border border-judge-500/30 bg-judge-500/5 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-judge-400">
              <span aria-hidden="true" className="text-lg">⚖️</span>
              <span>Sintesi finale del giudice</span>
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {orphanCharts.map((c) => (
                <ChartCard key={c.id} chart={c} />
              ))}
            </div>
          </section>
        )}

        {status === 'completed' && !expanded && (
          <p className="mt-1 text-center text-[11px] uppercase tracking-[0.22em] text-slate-500">
            ↓ scorri per il verdetto del giudice ↓
          </p>
        )}
      </div>
    </main>
  );
}

interface SpeechBubbleProps {
  turn: Turn;
  charts: ChartSpec[];
  streaming?: boolean;
}

function SpeechBubble({ turn, charts, streaming = false }: SpeechBubbleProps) {
  const { agent, phase, speech, attacksOpponent, toolCalls, index } = turn;
  const profile = AGENTS[agent];
  const isLeft = agent === 'optimist';
  const accent = isLeft
    ? 'border-optimist-500/40 bg-optimist-500/[0.06]'
    : 'border-skeptic-500/40 bg-skeptic-500/[0.06]';
  const labelColor = isLeft ? 'text-optimist-400' : 'text-skeptic-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: isLeft ? -24 : 24, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
      className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`max-w-[90%] rounded-2xl border ${accent} px-4 py-3 shadow-sm shadow-black/10`}>
        <div className="mb-1.5 flex items-center gap-2 text-xs">
          <span aria-hidden="true" className="text-lg">{profile.emoji}</span>
          <span className={`font-semibold ${labelColor}`}>{profile.shortLabel}</span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
            · {phase}
          </span>
          {!streaming && index >= 0 && (
            <span className="rounded bg-arena-bg px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              T{index + 1}
            </span>
          )}
          {toolCalls.length > 0 && (
            <span className="rounded bg-arena-bg px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              {toolCalls.length} tool
            </span>
          )}
        </div>
        <p
          className={`whitespace-pre-wrap text-[14px] leading-relaxed text-slate-100 ${streaming ? 'streaming-caret' : ''}`}
        >
          {speech}
        </p>
        {attacksOpponent && (
          <p className="mt-2 border-l-2 border-amber-500/60 pl-2 text-[11px] italic text-amber-200/80">
            ⚔️ Attacca: {attacksOpponent}
          </p>
        )}
        {charts.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2">
            {charts.map((c) => (
              <ChartCard key={c.id} chart={c} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export type { ArenaProps };
