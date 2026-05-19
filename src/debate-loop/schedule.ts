import type { PhaseStep } from '../types';

export const MIN_CONFRONTO_ROUNDS = 1;
export const MAX_CONFRONTO_ROUNDS = 4;
export const DEFAULT_CONFRONTO_ROUNDS = 2;

// La fase fissa (apertura + ricerca + chiusura) vale 6 turni totali
// (2 per fase, uno per agente). Il numero di turni totali e' quindi
// derivabile come 6 + 2 * confrontoRounds.
export const FIXED_PHASE_TURNS = 6;
export const TOTAL_TURNS_STEP = 2;
export const MIN_TOTAL_TURNS =
  FIXED_PHASE_TURNS + TOTAL_TURNS_STEP * MIN_CONFRONTO_ROUNDS;
export const MAX_TOTAL_TURNS =
  FIXED_PHASE_TURNS + TOTAL_TURNS_STEP * MAX_CONFRONTO_ROUNDS;

export function roundsToTotalTurns(rounds: number): number {
  return FIXED_PHASE_TURNS + TOTAL_TURNS_STEP * rounds;
}

// Converte un totale di turni (forzato pari nel range supportato) nel
// corrispondente numero di round di confronto.
export function totalTurnsToRounds(totalTurns: number): number {
  const clampedTotal = Math.max(
    MIN_TOTAL_TURNS,
    Math.min(MAX_TOTAL_TURNS, Math.round(totalTurns / TOTAL_TURNS_STEP) * TOTAL_TURNS_STEP),
  );
  return (clampedTotal - FIXED_PHASE_TURNS) / TOTAL_TURNS_STEP;
}

// Schedule generato dinamicamente in base ai round di confronto scelti
// dall'utente. Apertura/Ricerca/Chiusura restano fisse a 1 turno per
// agente; solo la fase di confronto e' modulabile (1..4 round).
//
// 1 round di confronto = 1 turno per agente = 2 turni totali aggiunti.
// Totale turni dibattito = 6 + 2 * rounds.
export function buildSchedule(rounds: number): PhaseStep[] {
  const clamped = Math.max(
    MIN_CONFRONTO_ROUNDS,
    Math.min(MAX_CONFRONTO_ROUNDS, Math.round(rounds)),
  );
  const schedule: PhaseStep[] = [
    { phase: 'apertura', agent: 'optimist', availableTools: [] },
    { phase: 'apertura', agent: 'skeptic', availableTools: [] },
    { phase: 'ricerca', agent: 'optimist', availableTools: ['web_search'] },
    { phase: 'ricerca', agent: 'skeptic', availableTools: ['web_search'] },
  ];
  const confrontoTools = [
    'web_search',
    'execute_code',
    'create_chart',
    'fact_check',
  ] as const;
  for (let r = 0; r < clamped; r++) {
    schedule.push({
      phase: 'confronto',
      agent: 'optimist',
      availableTools: [...confrontoTools],
    });
    schedule.push({
      phase: 'confronto',
      agent: 'skeptic',
      availableTools: [...confrontoTools],
    });
  }
  schedule.push({ phase: 'chiusura', agent: 'optimist', availableTools: [] });
  schedule.push({ phase: 'chiusura', agent: 'skeptic', availableTools: [] });
  return schedule;
}

export function totalTurnsFor(rounds: number): number {
  return buildSchedule(rounds).length;
}
