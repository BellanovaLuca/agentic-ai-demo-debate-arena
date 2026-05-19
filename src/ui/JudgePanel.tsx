import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useDebateStore } from '../store/debateStore';
import { buildSchedule } from '../debate-loop/schedule';
import { AGENTS, type AgentId } from '../types';
import type { PhaseStep } from '../types';
import { ScoreBar } from './ScoreBar';

// Massimo cumulato per asse: ogni turno fino a 10 punti per asse.
function computeMax(schedule: ReadonlyArray<PhaseStep>): {
  optimist: { default: number; counter: number };
  skeptic: { default: number; counter: number };
} {
  const counts = { optimist: 0, skeptic: 0 };
  for (const step of schedule) counts[step.agent]++;
  return {
    optimist: { default: counts.optimist * 10, counter: counts.optimist * 10 },
    skeptic: { default: counts.skeptic * 10, counter: counts.skeptic * 10 },
  };
}

export function JudgePanel() {
  const cum = useDebateStore((s) => s.cumulativeScore);
  const commentary = useDebateStore((s) => s.latestCommentary);
  const status = useDebateStore((s) => s.status);
  const activeSchedule = useDebateStore(useShallow((s) => s.activeSchedule));
  const confrontoRounds = useDebateStore((s) => s.confrontoRounds);

  const maxes = useMemo(() => {
    const schedule =
      activeSchedule.length > 0 ? activeSchedule : buildSchedule(confrontoRounds);
    return computeMax(schedule);
  }, [activeSchedule, confrontoRounds]);

  const optimistTotal =
    cum.optimist.logical + cum.optimist.sources + cum.optimist.data + cum.optimist.counter;
  const skepticTotal =
    cum.skeptic.logical + cum.skeptic.sources + cum.skeptic.data + cum.skeptic.counter;
  const totalMax =
    maxes.optimist.default * 3 + maxes.optimist.counter; // 3 assi default + counter

  const leading: AgentId | 'tie' =
    optimistTotal === skepticTotal
      ? 'tie'
      : optimistTotal > skepticTotal
        ? 'optimist'
        : 'skeptic';

  return (
    <section className="panel mx-4 mb-4 mt-2 overflow-hidden">
      {/* Header con bilancia, titolo e totali a colpo d'occhio */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-gradient-to-r from-judge-500/[0.06] via-transparent to-judge-500/[0.06] px-5 py-3">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="rounded-xl bg-gradient-to-br from-judge-400 to-judge-600 p-2 shadow-lg shadow-judge-500/30"
          >
            <span className="block h-5 w-5 text-center text-base leading-5">⚖️</span>
          </div>
          <div className="leading-tight">
            <h2 className="font-display text-lg font-semibold tracking-tight text-slate-100">
              Giudice
            </h2>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-slate-500">
              scoring live · 4 assi per agente
            </p>
          </div>
          {status === 'error' && (
            <span className="chip border-red-500/40 bg-red-500/10 text-red-300">
              errore di valutazione
            </span>
          )}
        </div>

        <ScoreboardSummary
          optimistTotal={optimistTotal}
          skepticTotal={skepticTotal}
          maxTotal={totalMax}
          leading={leading}
          status={status}
        />
      </header>

      <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2">
        <ScoreCard agentKey="optimist" />
        <ScoreCard agentKey="skeptic" />
      </div>

      <AnimatePresence mode="wait">
        {commentary && (
          <motion.div
            key={commentary}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-5 mb-4 rounded-lg border border-judge-500/30 bg-judge-500/[0.06] px-4 py-3"
          >
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-judge-400">
              Commento del giudice
            </div>
            <p className="text-sm italic leading-relaxed text-slate-100">
              &ldquo;{commentary}&rdquo;
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );

  function ScoreCard({ agentKey }: { agentKey: AgentId }) {
    const profile = AGENTS[agentKey];
    const score = cum[agentKey];
    const axisMax = maxes[agentKey];
    const color = agentKey === 'optimist' ? 'bg-optimist-500' : 'bg-skeptic-500';
    const accent =
      agentKey === 'optimist'
        ? 'border-optimist-500/30 from-optimist-500/[0.06]'
        : 'border-skeptic-500/30 from-skeptic-500/[0.06]';
    const accentText =
      agentKey === 'optimist' ? 'text-optimist-400' : 'text-skeptic-400';

    const total = score.logical + score.sources + score.data + score.counter;
    const isLeading =
      leading === agentKey && status !== 'idle' && total > 0;

    return (
      <div
        className={`rounded-xl border ${accent} bg-gradient-to-br to-transparent p-4`}
      >
        <div className="mb-3 flex items-center gap-2">
          <span aria-hidden="true" className="text-xl">{profile.emoji}</span>
          <div className="leading-tight">
            <div className={`font-display text-[15px] font-semibold ${accentText}`}>
              {profile.name}
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              {profile.shortLabel}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className={`font-mono text-2xl font-bold tabular-nums ${accentText}`}>
              {total}
            </div>
            <div className="text-[9.5px] uppercase tracking-[0.18em] text-slate-500">
              totale
            </div>
          </div>
          {isLeading && (
            <span className="ml-2 chip border-judge-500/40 bg-judge-500/15 text-judge-300">
              in vantaggio
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          <ScoreBar label="Logica" value={score.logical} max={axisMax.default} color={color} />
          <ScoreBar label="Fonti" value={score.sources} max={axisMax.default} color={color} />
          <ScoreBar label="Dati" value={score.data} max={axisMax.default} color={color} />
          <ScoreBar label="Replica" value={score.counter} max={axisMax.counter} color={color} />
        </div>
      </div>
    );
  }
}

function ScoreboardSummary({
  optimistTotal,
  skepticTotal,
  maxTotal,
  leading,
  status,
}: {
  optimistTotal: number;
  skepticTotal: number;
  maxTotal: number;
  leading: AgentId | 'tie';
  status: string;
}) {
  if (status === 'idle' || (optimistTotal === 0 && skepticTotal === 0)) {
    return (
      <span className="text-[11px] italic text-slate-500">
        in attesa dei primi turni…
      </span>
    );
  }
  return (
    <div className="flex items-center gap-3 font-mono text-sm">
      <span className="text-optimist-400">
        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Ott</span>{' '}
        <span className="text-xl font-bold tabular-nums">{optimistTotal}</span>
      </span>
      <span className="text-slate-600">vs</span>
      <span className="text-skeptic-400">
        <span className="text-xl font-bold tabular-nums">{skepticTotal}</span>{' '}
        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Sce</span>
      </span>
      {maxTotal > 0 && (
        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          / {maxTotal} max
        </span>
      )}
      {leading !== 'tie' && (
        <span className="chip border-judge-500/40 bg-judge-500/10 text-judge-300">
          ▲ {leading === 'optimist' ? 'Ott' : 'Sce'}
        </span>
      )}
    </div>
  );
}
