import type { ToolName } from '../types';
import { runCreateChart } from './createChart';
import { runExecuteCode } from './executeCode';
import { runFactCheck } from './factCheck';
import type { ParsedToolCall, ToolContext, ToolResult } from './types';
import { runWebSearch } from './webSearch';

// Dispatcher singolo. Garantisce che ogni tool venga eseguito con il proprio
// shape di args. Rifiuta tool non in lista.
export async function dispatchToolCall(
  call: ParsedToolCall,
  ctx: ToolContext,
  allowedTools: ReadonlyArray<ToolName>,
): Promise<ToolResult> {
  if (!allowedTools.includes(call.tool)) {
    throw new Error(
      `Tool "${call.tool}" non disponibile in questa fase (consentiti: ${allowedTools.join(', ') || 'nessuno'}).`,
    );
  }

  switch (call.tool) {
    case 'web_search':
      return runWebSearch(call.args, ctx);
    case 'execute_code':
      return runExecuteCode(call.args);
    case 'create_chart':
      return runCreateChart(call.args, ctx);
    case 'fact_check':
      return runFactCheck(call.args);
    default: {
      // Exhaustive check (vista la discriminated union su ToolName).
      const _exhaustive: never = call.tool;
      throw new Error(`Tool sconosciuto: ${String(_exhaustive)}`);
    }
  }
}
