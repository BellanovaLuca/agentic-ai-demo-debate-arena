import { generate } from '../lib/gemini';
import { parseLlmJson } from '../lib/jsonParse';
import { createLogger } from '../lib/logger';
import { buildJudgeTurnPrompt, buildVerdictPrompt } from '../judge/prompts';
import type {
  CumulativeScore,
  JudgeEvalRow,
  ScoreAxes,
  Turn,
  Verdict,
} from '../types';
import { EMPTY_SCORE } from '../types';

const log = createLogger('judge');

interface RawAxes {
  logical?: unknown;
  sources?: unknown;
  data?: unknown;
  counter?: unknown;
}
interface RawEval {
  optimist?: RawAxes;
  skeptic?: RawAxes;
  commentary?: unknown;
}

function clampAxis(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(10, Math.round(v)));
}

function normalizeAxes(raw: RawAxes | undefined): ScoreAxes {
  if (!raw) return { ...EMPTY_SCORE };
  return {
    logical: clampAxis(raw.logical),
    sources: clampAxis(raw.sources),
    data: clampAxis(raw.data),
    counter: clampAxis(raw.counter),
  };
}

export async function evaluateTurn(args: {
  topic: string;
  history: ReadonlyArray<Turn>;
  lastTurn: Turn;
}): Promise<JudgeEvalRow> {
  const { systemInstruction, userPrompt } = buildJudgeTurnPrompt(args);
  const { text } = await generate({
    systemInstruction,
    userPrompt,
    jsonOutput: true,
    temperature: 0.4,
    timeoutMs: 45_000,
  });
  const parsed = parseLlmJson<RawEval>(text);
  const optimist = normalizeAxes(parsed.optimist);
  const skeptic = normalizeAxes(parsed.skeptic);
  const commentary =
    typeof parsed.commentary === 'string'
      ? parsed.commentary.trim().slice(0, 600)
      : '';
  log.info(
    `eval turn ${args.lastTurn.index + 1}: opt[L${optimist.logical} S${optimist.sources} D${optimist.data} C${optimist.counter}] skp[L${skeptic.logical} S${skeptic.sources} D${skeptic.data} C${skeptic.counter}]`,
  );
  return { optimist, skeptic, commentary };
}

interface RawVerdict {
  winner?: unknown;
  reasoning?: unknown;
  highlights?: unknown;
}

export async function emitVerdict(args: {
  topic: string;
  history: ReadonlyArray<Turn>;
  cumulativeScore: CumulativeScore;
}): Promise<Verdict> {
  const { systemInstruction, userPrompt } = buildVerdictPrompt(args);
  const { text } = await generate({
    systemInstruction,
    userPrompt,
    jsonOutput: true,
    temperature: 0.6,
    timeoutMs: 60_000,
  });
  const parsed = parseLlmJson<RawVerdict>(text);
  const winnerRaw = String(parsed.winner ?? '').toLowerCase();
  const winner: Verdict['winner'] =
    winnerRaw === 'optimist' || winnerRaw === 'skeptic' || winnerRaw === 'tie'
      ? (winnerRaw as Verdict['winner'])
      : 'tie';
  const reasoning =
    typeof parsed.reasoning === 'string'
      ? parsed.reasoning.trim()
      : 'Motivazione non disponibile.';
  const highlights = Array.isArray(parsed.highlights)
    ? parsed.highlights
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((s) => s.trim().slice(0, 300))
        .slice(0, 6)
    : [];

  return {
    winner,
    reasoning,
    finalScores: args.cumulativeScore,
    highlights,
  };
}
