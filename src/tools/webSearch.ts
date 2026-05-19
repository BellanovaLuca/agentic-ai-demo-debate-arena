import { generate } from '../lib/gemini';
import { newId } from '../lib/ids';
import { createLogger } from '../lib/logger';
import type { Citation } from '../types';
import type { ToolContext, WebSearchResult } from './types';

const log = createLogger('tool:web_search');

// web_search: usa una chiamata Gemini dedicata con Google Search grounding.
// Restituisce un breve riassunto delle informazioni piu rilevanti +
// le citazioni estratte dal groundingMetadata.
export async function runWebSearch(
  args: { query?: unknown },
  ctx: ToolContext,
): Promise<WebSearchResult> {
  const query =
    typeof args.query === 'string' && args.query.trim().length > 0
      ? args.query.trim().slice(0, 300)
      : null;
  if (!query) {
    throw new Error('web_search: parametro "query" mancante o invalido.');
  }

  log.info(`query: "${query}"`);

  const { text, groundingChunks } = await generate({
    systemInstruction: `Sei un assistente di ricerca per un dibattito sul tema "${ctx.topic}".
Dato una query, cerca informazioni recenti e affidabili usando Google Search.
Produci una sintesi di 2-4 frasi, sobria e fattuale (italiano).
Niente opinioni, solo cio che le fonti affermano. Mai inventare numeri.`,
    userPrompt: `Query di ricerca: ${query}`,
    enableSearchGrounding: true,
    temperature: 0.3,
    timeoutMs: 45_000,
  });

  const now = Date.now();
  const citations: Citation[] = groundingChunks.slice(0, 5).map((c) => ({
    id: newId('cit'),
    url: c.uri,
    title: c.title || c.uri,
    snippet: (c.snippet ?? '').slice(0, 400),
    agent: ctx.agent,
    collectedAt: now,
  }));

  log.info(`got ${citations.length} citations`);

  return {
    tool: 'web_search',
    query,
    citations,
    summary: text.trim(),
  };
}
