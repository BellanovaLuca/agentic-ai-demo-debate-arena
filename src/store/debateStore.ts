import { create } from 'zustand';

import type {
  AgentId,
  ChartSpec,
  Citation,
  CumulativeScore,
  DebateConfig,
  DebateSpeed,
  DebateState,
  DebateStatus,
  JudgeEvalRow,
  PhaseStep,
  ScoreAxes,
  ToolCallRecord,
  Turn,
  Verdict,
} from '../types';
import { AGENTS, EMPTY_SCORE } from '../types';
import { DEFAULT_CONFRONTO_ROUNDS } from '../debate-loop/schedule';

// Store Zustand, fonte unica di verita per la UI.
// Tutte le mutazioni passano da action tipizzate. Niente stato fuori store.

interface DebateActions {
  reset: () => void;
  setStatus: (s: DebateStatus, error?: string | null) => void;
  setConfig: (c: DebateConfig) => void;
  appendTurn: (turn: Turn) => void;
  applyJudgeEval: (turnId: string, evaluation: JudgeEvalRow) => void;
  setLiveThinking: (agent: AgentId, text: string) => void;
  setLiveSpeech: (agent: AgentId, text: string) => void;
  setActiveToolCall: (agent: AgentId, call: ToolCallRecord | null) => void;
  addCitations: (citations: ReadonlyArray<Citation>) => void;
  addChart: (chart: ChartSpec) => void;
  setVerdict: (v: Verdict) => void;
  advanceStep: () => void;
  setCurrentStepIndex: (i: number) => void;

  // Controlli di playback
  setSpeed: (s: DebateSpeed) => void;
  togglePause: () => void;
  requestCancel: () => void;
  setConfrontoRounds: (n: number) => void;
  setActiveSchedule: (s: PhaseStep[]) => void;
}

const initial: DebateState = {
  status: 'idle',
  config: null,
  currentStepIndex: 0,
  turns: [],
  citationsById: {},
  chartsById: {},
  cumulativeScore: { optimist: { ...EMPTY_SCORE }, skeptic: { ...EMPTY_SCORE } },
  latestCommentary: '',
  verdict: null,
  error: null,
  liveThinking: { optimist: '', skeptic: '' },
  liveSpeech: { optimist: '', skeptic: '' },
  activeToolCall: { optimist: null, skeptic: null },
  speed: 1,
  isPaused: false,
  cancelRequested: false,
  confrontoRounds: DEFAULT_CONFRONTO_ROUNDS,
  activeSchedule: [],
};

function addAxes(a: ScoreAxes, b: ScoreAxes): ScoreAxes {
  return {
    logical: a.logical + b.logical,
    sources: a.sources + b.sources,
    data: a.data + b.data,
    counter: a.counter + b.counter,
  };
}

export const useDebateStore = create<DebateState & DebateActions>((set) => ({
  ...initial,

  reset: () =>
    // Mantiene la velocita e i round scelti dall'utente, resetta tutto il
    // resto (compresi i flag isPaused/cancelRequested) a inizio run.
    set((s) => ({
      ...initial,
      speed: s.speed,
      confrontoRounds: s.confrontoRounds,
    })),

  setStatus: (status, error = null) => set({ status, error }),

  setConfig: (config) => set({ config, status: 'configuring' }),

  appendTurn: (turn) =>
    set((s) => {
      const liveThinking = { ...s.liveThinking, [turn.agent]: '' };
      const liveSpeech = { ...s.liveSpeech, [turn.agent]: '' };
      return {
        turns: [...s.turns, turn],
        liveThinking,
        liveSpeech,
      };
    }),

  applyJudgeEval: (turnId, evaluation) =>
    set((s) => {
      const turns = s.turns.map((t) =>
        t.id === turnId ? { ...t, judgeEval: evaluation } : t,
      );
      const cumulativeScore: CumulativeScore = {
        optimist: addAxes(s.cumulativeScore.optimist, evaluation.optimist),
        skeptic: addAxes(s.cumulativeScore.skeptic, evaluation.skeptic),
      };
      return {
        turns,
        cumulativeScore,
        latestCommentary: evaluation.commentary,
      };
    }),

  setLiveThinking: (agent, text) =>
    set((s) => ({ liveThinking: { ...s.liveThinking, [agent]: text } })),

  setLiveSpeech: (agent, text) =>
    set((s) => ({ liveSpeech: { ...s.liveSpeech, [agent]: text } })),

  setActiveToolCall: (agent, call) =>
    set((s) => ({ activeToolCall: { ...s.activeToolCall, [agent]: call } })),

  addCitations: (citations) =>
    set((s) => {
      if (citations.length === 0) return {};
      const next = { ...s.citationsById };
      for (const c of citations) next[c.id] = c;
      return { citationsById: next };
    }),

  addChart: (chart) =>
    set((s) => ({ chartsById: { ...s.chartsById, [chart.id]: chart } })),

  setVerdict: (verdict) => set({ verdict, status: 'completed' }),

  advanceStep: () => set((s) => ({ currentStepIndex: s.currentStepIndex + 1 })),

  setCurrentStepIndex: (i) => set({ currentStepIndex: i }),

  setSpeed: (speed) => set({ speed }),

  togglePause: () =>
    set((s) => {
      if (s.status === 'running') return { isPaused: true, status: 'paused' };
      if (s.status === 'paused') return { isPaused: false, status: 'running' };
      return {};
    }),

  requestCancel: () => set({ cancelRequested: true, isPaused: false }),

  setConfrontoRounds: (n) => set({ confrontoRounds: n }),

  setActiveSchedule: (activeSchedule) => set({ activeSchedule }),
}));

// Selectors riusabili — evitano subscribe a tutto lo store.

export function selectOwnCitations(state: DebateState, agent: AgentId): Citation[] {
  return Object.values(state.citationsById)
    .filter((c) => c.agent === agent)
    .sort((a, b) => a.collectedAt - b.collectedAt);
}

export function selectAgentCharts(
  state: DebateState,
  agent: AgentId,
): ChartSpec[] {
  return Object.values(state.chartsById)
    .filter((c) => c.agent === agent)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function selectAllCharts(state: DebateState): ChartSpec[] {
  return Object.values(state.chartsById).sort(
    (a, b) => a.createdAt - b.createdAt,
  );
}

export function selectLastTurnOfOpponent(
  state: DebateState,
  agent: AgentId,
): Turn | null {
  const opp = AGENTS[agent].id === 'optimist' ? 'skeptic' : 'optimist';
  for (let i = state.turns.length - 1; i >= 0; i--) {
    const t = state.turns[i];
    if (t && t.agent === opp) return t;
  }
  return null;
}
