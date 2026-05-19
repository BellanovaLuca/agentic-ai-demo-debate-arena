import type { AgentId, ChartSpec, Citation, ToolName } from '../types';

// Risultato strutturato per ogni tool. La discriminated union sul campo `tool`
// permette al consumer di sapere esattamente quale shape leggere.

export interface WebSearchResult {
  tool: 'web_search';
  query: string;
  citations: Citation[];
  summary: string;
}

export interface ExecuteCodeResult {
  tool: 'execute_code';
  code: string;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface CreateChartResult {
  tool: 'create_chart';
  chart: ChartSpec;
}

export interface FactCheckResult {
  tool: 'fact_check';
  claim: string;
  sourceUrl: string;
  score: number;
  verdict: string;
  notes: string;
}

export type ToolResult =
  | WebSearchResult
  | ExecuteCodeResult
  | CreateChartResult
  | FactCheckResult;

export interface ToolContext {
  agent: AgentId;
  topic: string;
  // Citazioni che l'agente ha gia raccolto in questa sessione (lookup veloce).
  ownCitations: ReadonlyArray<Citation>;
}

export interface ParsedToolCall {
  tool: ToolName;
  args: Record<string, unknown>;
}
