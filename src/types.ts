// Tipi centrali del dominio "debate".
// Un solo file di tipi tiene il modello mentale del progetto coerente.

export type Phase = 'apertura' | 'ricerca' | 'confronto' | 'chiusura';

export type AgentId = 'optimist' | 'skeptic';

export type ToolName =
  | 'web_search'
  | 'execute_code'
  | 'create_chart'
  | 'fact_check';

export interface AgentProfile {
  id: AgentId;
  name: string;
  emoji: string;
  shortLabel: string;
  themeKey: 'optimist' | 'skeptic';
}

export interface Citation {
  id: string;
  url: string;
  title: string;
  snippet: string;
  agent: AgentId;
  collectedAt: number;
}

export interface ChartSpec {
  id: string;
  type: 'line' | 'bar' | 'pie';
  title: string;
  xKey: string;
  yKey: string;
  data: Array<Record<string, string | number>>;
  agent: AgentId;
  createdAt: number;
}

export interface ToolCallRecord {
  id: string;
  tool: ToolName;
  args: Record<string, unknown>;
  status: 'running' | 'done' | 'error';
  result?: unknown;
  error?: string;
  startedAt: number;
  finishedAt?: number;
}

export interface Turn {
  id: string;
  index: number;
  phase: Phase;
  agent: AgentId;
  thinking: string;
  speech: string;
  attacksOpponent?: string;
  toolCalls: ToolCallRecord[];
  citationsCollected: string[];
  chartsCreated: string[];
  judgeEval: JudgeEvalRow | null;
  createdAt: number;
}

export interface ScoreAxes {
  logical: number;
  sources: number;
  data: number;
  counter: number;
}

export interface JudgeEvalRow {
  optimist: ScoreAxes;
  skeptic: ScoreAxes;
  commentary: string;
}

export interface CumulativeScore {
  optimist: ScoreAxes;
  skeptic: ScoreAxes;
}

export interface Verdict {
  winner: AgentId | 'tie';
  reasoning: string;
  finalScores: CumulativeScore;
  highlights: string[];
}

export type DebateStatus =
  | 'idle'
  | 'configuring'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'error';

export type DebateSpeed = 0.25 | 0.5 | 1 | 2 | 4;

export interface PhaseStep {
  phase: Phase;
  agent: AgentId;
  availableTools: ToolName[];
}

export interface DebateConfig {
  topic: string;
  positions: {
    optimist: string;
    skeptic: string;
  };
}

// Snapshot pubblico dello stato del dibattito.
// Tutti i campi sono leggibili dalla UI tramite Zustand selectors.
export interface DebateState {
  status: DebateStatus;
  config: DebateConfig | null;
  currentStepIndex: number;
  turns: Turn[];
  citationsById: Record<string, Citation>;
  chartsById: Record<string, ChartSpec>;
  cumulativeScore: CumulativeScore;
  latestCommentary: string;
  verdict: Verdict | null;
  error: string | null;

  // Streaming / live UI state
  liveThinking: Record<AgentId, string>;
  liveSpeech: Record<AgentId, string>;
  activeToolCall: Record<AgentId, ToolCallRecord | null>;

  // Controlli di playback (persistono tra dibattiti per "speed" e
  // "confrontoRounds", resettati per isPaused / cancelRequested
  // all'inizio di ogni run).
  speed: DebateSpeed;
  isPaused: boolean;
  cancelRequested: boolean;
  // Numero di round di confronto scelti dall'utente (1..4).
  confrontoRounds: number;
  // Schedule effettivamente in esecuzione: snapshotta la scelta dell'utente
  // al momento di START cosi cambiare confrontoRounds a meta dibattito
  // non rompe nulla.
  activeSchedule: PhaseStep[];
}

export const EMPTY_SCORE: ScoreAxes = {
  logical: 0,
  sources: 0,
  data: 0,
  counter: 0,
};

export const AGENTS: Record<AgentId, AgentProfile> = {
  optimist: {
    id: 'optimist',
    name: "L'Ottimista Tech",
    emoji: '🚀',
    shortLabel: 'Ottimista',
    themeKey: 'optimist',
  },
  skeptic: {
    id: 'skeptic',
    name: 'Lo Scettico Critico',
    emoji: '🧐',
    shortLabel: 'Scettico',
    themeKey: 'skeptic',
  },
};

export function opponentOf(agent: AgentId): AgentId {
  return agent === 'optimist' ? 'skeptic' : 'optimist';
}
