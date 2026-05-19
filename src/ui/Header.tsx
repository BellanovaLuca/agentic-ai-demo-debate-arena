import { useState } from 'react';

import { APP_ENV } from '../lib/env';
import { runDebate } from '../debate-loop/runDebate';
import {
  MAX_TOTAL_TURNS,
  MIN_TOTAL_TURNS,
  TOTAL_TURNS_STEP,
  roundsToTotalTurns,
  totalTurnsToRounds,
} from '../debate-loop/schedule';
import { useDebateStore } from '../store/debateStore';
import type { DebateSpeed } from '../types';
import { ExportButton } from './ExportButton';
import { InfoDialog } from './InfoDialog';
import { InfoIcon, SparkIcon } from './icons';

const EXAMPLE_TOPICS = [
  'Le AI generative aumenteranno la produttivita globale del 30% entro il 2030',
  "L'energia da fusione sara commercialmente disponibile entro il 2040",
  'Le auto a guida autonoma di livello 5 saranno mainstream entro il 2035',
  'I lavori manuali saranno automatizzati piu velocemente di quelli cognitivi',
  'La realta aumentata sostituira gli smartphone come device primario entro il 2032',
];

const SPEEDS: DebateSpeed[] = [0.25, 0.5, 1, 2, 4];

export function Header() {
  const status = useDebateStore((s) => s.status);
  const speed = useDebateStore((s) => s.speed);
  const isPaused = useDebateStore((s) => s.isPaused);
  const confrontoRounds = useDebateStore((s) => s.confrontoRounds);
  const setSpeed = useDebateStore((s) => s.setSpeed);
  const setConfrontoRounds = useDebateStore((s) => s.setConfrontoRounds);
  const togglePause = useDebateStore((s) => s.togglePause);
  const requestCancel = useDebateStore((s) => s.requestCancel);

  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const isRunning =
    status === 'configuring' || status === 'running' || status === 'paused';

  const onStart = async () => {
    setError(null);
    if (!APP_ENV.geminiApiKey) {
      setError(
        'VITE_GEMINI_API_KEY mancante. Copia .env.example in .env e inserisci la chiave Gemini.',
      );
      return;
    }
    const trimmed = topic.trim();
    if (trimmed.length < 8) {
      setError('Inserisci un tema di almeno 8 caratteri.');
      return;
    }
    try {
      await runDebate({ topic: trimmed });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const useExample = () => {
    const idx = Math.floor(Math.random() * EXAMPLE_TOPICS.length);
    setTopic(EXAMPLE_TOPICS[idx] ?? '');
  };

  return (
    <header className="panel mx-4 mt-4 overflow-hidden">
      {/* Riga 1: brand + controlli rapidi */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-optimist-500 to-skeptic-500 p-2 shadow-lg shadow-skeptic-500/20">
            <SparkIcon className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <h1
              className="font-display text-xl font-semibold tracking-tight text-white"
              translate="no"
            >
              Debate Arena
            </h1>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-slate-500">
              due agenti · quattro tool · un giudice
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TotalTurnsSelector
            rounds={confrontoRounds}
            onChange={setConfrontoRounds}
            disabled={isRunning}
          />
          <SpeedSelector speed={speed} setSpeed={setSpeed} />
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            aria-label="Come funziona Debate Arena"
            title="Come funziona Debate Arena"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-arena-border bg-arena-bg/50 text-slate-400 transition-colors hover:border-optimist-500/40 hover:text-optimist-300"
          >
            <InfoIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Riga 2: campo tema (hero) + colonna azioni a destra */}
      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="topic-input"
              className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400"
            >
              Tema del dibattito
            </label>
            <button
              type="button"
              onClick={useExample}
              disabled={isRunning}
              className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-slate-200 disabled:opacity-40"
              title="Inserisci un tema di esempio"
            >
              <span aria-hidden="true">🎲</span> esempio random
            </button>
          </div>
          <textarea
            id="topic-input"
            name="debate-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isRunning}
            placeholder="Es. Le AI generative aumenteranno la produttività globale del 30% entro il 2030…"
            rows={2}
            maxLength={500}
            autoComplete="off"
            className="w-full min-h-[52px] max-h-[160px] resize-y rounded-lg border border-arena-border bg-arena-bg/70 px-3.5 py-2.5 text-sm leading-snug text-slate-100 placeholder:text-slate-500 focus-visible:border-optimist-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-optimist-500/30 disabled:opacity-60"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isRunning) {
                e.preventDefault();
                onStart();
              }
            }}
          />
          <div className="flex items-center justify-end text-[10px] text-slate-500">
            <span className="font-mono">{topic.length}/500</span>
          </div>
        </div>

        {/* Colonna azioni: START primario sopra, Export secondario sotto.
            Stretched alla stessa larghezza per allineamento ottico. */}
        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 md:w-[160px]">
          {isRunning ? (
            <>
              <button
                type="button"
                onClick={togglePause}
                className="btn-primary w-full"
                title={isPaused ? 'Riprendi il dibattito' : 'Metti in pausa'}
              >
                {isPaused ? '▶ Riprendi' : '⏸ Pausa'}
              </button>
              <button
                type="button"
                onClick={requestCancel}
                className="btn-ghost w-full text-red-300 hover:bg-red-500/10"
                title="Interrompi il dibattito"
              >
                ⏹ Stop
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onStart}
                className="btn-primary w-full"
              >
                START ▶
              </button>
              <ExportButton className="w-full justify-center" />
            </>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="border-t border-red-500/30 bg-red-500/10 px-5 py-2"
        >
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}
      <InfoDialog open={infoOpen} onClose={() => setInfoOpen(false)} />
    </header>
  );
}

// L'utente sceglie esplicitamente il numero TOTALE di turni del dibattito,
// vincolato a valori pari (ogni round di confronto aggiunge 2 turni — uno
// per agente — quindi il totale e' sempre pari per costruzione).
function TotalTurnsSelector({
  rounds,
  onChange,
  disabled,
}: {
  rounds: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  const options: number[] = [];
  for (let t = MIN_TOTAL_TURNS; t <= MAX_TOTAL_TURNS; t += TOTAL_TURNS_STEP) {
    options.push(t);
  }
  const currentTotal = roundsToTotalTurns(rounds);

  return (
    <div
      className={`flex items-center gap-1 rounded-lg border border-arena-border bg-arena-bg/50 p-0.5 ${disabled ? 'opacity-60' : ''}`}
      title="Turni totali del dibattito (sempre pari)"
    >
      <span className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Turni
      </span>
      {options.map((total) => {
        const selected = total === currentTotal;
        return (
          <button
            key={total}
            type="button"
            disabled={disabled}
            onClick={() => onChange(totalTurnsToRounds(total))}
            aria-pressed={selected}
            className={`rounded px-2.5 py-1 font-mono text-xs transition-colors ${
              selected
                ? 'bg-gradient-to-br from-optimist-500 to-skeptic-500 text-white shadow-inner shadow-black/20'
                : 'text-slate-400 hover:bg-white/5 disabled:hover:bg-transparent'
            }`}
            title={`Dibattito da ${total} turni`}
          >
            {total}
          </button>
        );
      })}
    </div>
  );
}

function SpeedSelector({
  speed,
  setSpeed,
}: {
  speed: DebateSpeed;
  setSpeed: (s: DebateSpeed) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-arena-border bg-arena-bg/50 p-0.5">
      <span className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Speed
      </span>
      {SPEEDS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setSpeed(s)}
          aria-pressed={speed === s}
          className={`rounded px-2 py-1 font-mono text-xs transition-colors ${
            speed === s
              ? 'bg-gradient-to-br from-optimist-500 to-skeptic-500 text-white shadow-inner shadow-black/20'
              : 'text-slate-400 hover:bg-white/5'
          }`}
          title={`Velocita ${s}x — scala le pause tra turni`}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}
