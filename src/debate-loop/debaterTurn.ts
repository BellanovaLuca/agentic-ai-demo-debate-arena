import {
  buildDebaterSystemPrompt,
  buildDebaterUserPrompt,
} from '../agents/prompts';
import { generate } from '../lib/gemini';
import { newId } from '../lib/ids';
import { parseLlmJson } from '../lib/jsonParse';
import { createLogger } from '../lib/logger';
import { sleep } from '../lib/timeout';
import {
  selectLastTurnOfOpponent,
  selectOwnCitations,
  useDebateStore,
} from '../store/debateStore';
import { dispatchToolCall } from '../tools/dispatch';
import type {
  CreateChartResult,
  ParsedToolCall,
  ToolContext,
  ToolResult,
  WebSearchResult,
} from '../tools/types';
import type {
  AgentId,
  ChartSpec,
  Citation,
  Phase,
  ToolCallRecord,
  ToolName,
  Turn,
} from '../types';
import { extractPartialField } from './streamingParser';

const log = createLogger('debater');

// Tempo minimo per cui la card "Tool in esecuzione" resta visibile nella
// colonna dell'agente. Alcuni tool (create_chart, execute_code, fact_check
// mockato) completano in pochi ms: senza questa pausa l'utente non fa in
// tempo a leggere quale tool e' stato chiamato. Scalato con la velocita'
// del dibattito cosi su 4x rimane comunque proporzionale.
const MIN_ACTIVE_TOOL_DISPLAY_MS = 1500;
function minToolDisplayMsForSpeed(speed: number): number {
  if (!speed || speed <= 0) return MIN_ACTIVE_TOOL_DISPLAY_MS;
  return Math.max(400, Math.round(MIN_ACTIVE_TOOL_DISPLAY_MS / speed));
}

interface RawAgentOutput {
  thinking?: unknown;
  tool_calls?: unknown;
  speech?: unknown;
  attacks_opponent?: unknown;
}

export interface DebaterTurnArgs {
  agent: AgentId;
  phase: Phase;
  availableTools: ReadonlyArray<ToolName>;
  position: string;
  topic: string;
  stepIndex: number;
  totalSteps: number;
}

// Esegue una singola mossa di un debater:
// 1) chiama Gemini con streaming (aggiorna live UI per "thinking" e "speech")
// 2) parsa JSON
// 3) per ogni tool_call dichiarato, dispatcha ed accumula risultati
// 4) compone e ritorna il Turn (non lo committa al store: lo fa il loop).
export async function executeDebaterTurn(args: DebaterTurnArgs): Promise<Turn> {
  const {
    agent,
    phase,
    availableTools,
    position,
    topic,
    stepIndex,
    totalSteps,
  } = args;

  const store = useDebateStore.getState();
  const history = store.turns;
  const ownCitations = selectOwnCitations(store, agent);
  const opponentTurn = selectLastTurnOfOpponent(store, agent);

  const promptParams = {
    agentId: agent,
    phase,
    position,
    topic,
    turnNumber: stepIndex + 1,
    totalTurns: totalSteps,
    availableTools: [...availableTools],
    history,
    ownCitations,
    opponentLastSpeech: opponentTurn?.speech ?? null,
  };

  const systemInstruction = buildDebaterSystemPrompt(promptParams);
  const userPrompt = buildDebaterUserPrompt(promptParams);

  // Reset live UI buffers per questo agente.
  useDebateStore.getState().setLiveThinking(agent, '');
  useDebateStore.getState().setLiveSpeech(agent, '');

  log.info(`turn ${stepIndex + 1}/${totalSteps} — ${agent} (${phase})`);

  const { text } = await generate({
    systemInstruction,
    userPrompt,
    temperature: agent === 'optimist' ? 0.85 : 0.6,
    jsonOutput: true,
    timeoutMs: 90_000,
    onChunk: (_delta, full) => {
      const thinking = extractPartialField(full, 'thinking');
      if (thinking !== null) {
        useDebateStore.getState().setLiveThinking(agent, thinking);
      }
      const speech = extractPartialField(full, 'speech');
      if (speech !== null) {
        useDebateStore.getState().setLiveSpeech(agent, speech);
      }
    },
  });

  const parsed = parseLlmJson<RawAgentOutput>(text);
  const thinking =
    typeof parsed.thinking === 'string' ? parsed.thinking.trim() : '';
  const speech =
    typeof parsed.speech === 'string' ? parsed.speech.trim() : '';
  const attacks_opponent =
    typeof parsed.attacks_opponent === 'string'
      ? parsed.attacks_opponent.trim()
      : '';

  if (!speech) {
    throw new Error(`Output agente ${agent}: campo "speech" vuoto.`);
  }

  // Aggiorna live buffers con valori definitivi.
  useDebateStore.getState().setLiveThinking(agent, thinking);
  useDebateStore.getState().setLiveSpeech(agent, speech);

  const rawCalls = Array.isArray(parsed.tool_calls) ? parsed.tool_calls : [];
  const toolCalls: ToolCallRecord[] = [];
  const citationsCollected: string[] = [];
  const chartsCreated: string[] = [];

  for (const raw of rawCalls) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as { tool?: unknown; args?: unknown };
    const toolName = String(r.tool ?? '') as ToolName;
    const callArgs =
      r.args && typeof r.args === 'object'
        ? (r.args as Record<string, unknown>)
        : {};

    const record: ToolCallRecord = {
      id: newId('tc'),
      tool: toolName,
      args: callArgs,
      status: 'running',
      startedAt: Date.now(),
    };
    useDebateStore.getState().setActiveToolCall(agent, record);
    const shownAt = Date.now();

    try {
      const ctx: ToolContext = {
        agent,
        topic,
        ownCitations,
      };
      const parsedCall: ParsedToolCall = { tool: toolName, args: callArgs };
      const result: ToolResult = await dispatchToolCall(
        parsedCall,
        ctx,
        availableTools,
      );

      record.status = 'done';
      record.result = result;
      record.finishedAt = Date.now();
      toolCalls.push(record);

      // Side-effect sullo store per i tool che producono entita persistenti.
      if (result.tool === 'web_search') {
        const ws = result as WebSearchResult;
        if (ws.citations.length > 0) {
          useDebateStore.getState().addCitations(ws.citations);
          for (const c of ws.citations) citationsCollected.push(c.id);
        }
      } else if (result.tool === 'create_chart') {
        const cr = result as CreateChartResult;
        const chart: ChartSpec = cr.chart;
        useDebateStore.getState().addChart(chart);
        chartsCreated.push(chart.id);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      log.warn(`tool ${toolName} failed: ${message}`);
      record.status = 'error';
      record.error = message;
      record.finishedAt = Date.now();
      toolCalls.push(record);
    } finally {
      // Tieni visibile la card del tool per un tempo minimo cosi l'utente
      // riesce a leggerla anche per tool che completano in pochi ms.
      const currentSpeed = useDebateStore.getState().speed;
      const minDisplay = minToolDisplayMsForSpeed(currentSpeed);
      const elapsed = Date.now() - shownAt;
      const remaining = minDisplay - elapsed;
      if (remaining > 0) {
        // Aggiorna lo stato nella card cosi l'utente vede done/error mentre
        // resta visibile (e non solo "running").
        useDebateStore.getState().setActiveToolCall(agent, { ...record });
        await sleep(remaining);
      }
      useDebateStore.getState().setActiveToolCall(agent, null);
    }
  }

  const turn: Turn = {
    id: newId('turn'),
    index: stepIndex,
    phase,
    agent,
    thinking,
    speech,
    attacksOpponent: attacks_opponent || undefined,
    toolCalls,
    citationsCollected,
    chartsCreated,
    judgeEval: null,
    createdAt: Date.now(),
  };

  return turn;
}

// Helper utile fuori dal modulo per typing.
export type { Citation };
