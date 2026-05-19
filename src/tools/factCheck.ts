import { generate } from '../lib/gemini';
import { parseLlmJson } from '../lib/jsonParse';
import { createLogger } from '../lib/logger';
import type { FactCheckResult } from './types';

const log = createLogger('tool:fact_check');

interface RawFactCheck {
  score?: unknown;
  verdict?: unknown;
  notes?: unknown;
}

// fact_check: valuta la solidita di una fonte rispetto a una claim.
// Chiamata Gemini dedicata, JSON output.
export async function runFactCheck(args: {
  claim?: unknown;
  sourceUrl?: unknown;
}): Promise<FactCheckResult> {
  const claim =
    typeof args.claim === 'string' && args.claim.trim().length > 0
      ? args.claim.trim().slice(0, 600)
      : null;
  const sourceUrl =
    typeof args.sourceUrl === 'string' && args.sourceUrl.trim().length > 0
      ? args.sourceUrl.trim().slice(0, 400)
      : null;

  if (!claim) {
    throw new Error('fact_check: "claim" mancante.');
  }
  if (!sourceUrl) {
    throw new Error('fact_check: "sourceUrl" mancante.');
  }

  log.info(`claim="${claim.slice(0, 60)}..." src=${sourceUrl}`);

  const { text } = await generate({
    systemInstruction: `Sei un fact-checker rigoroso. Data una claim e l'URL di una fonte, devi
valutare quanto la fonte e' adeguata a sostenere la claim. Valuti:
- autorita della fonte (sito ufficiale, peer-reviewed, blog anonimo, ...)
- pertinenza della fonte alla claim
- freschezza (anno di pubblicazione se inferibile)

Non navighi davvero il web: ragiona sull'URL e sul dominio, sul tipo di
contenuto plausibilmente presente, e sii esplicito sulle assunzioni.

Output SOLO JSON: { "score": N (0-10 intero), "verdict": "...", "notes": "..." }
- "verdict" e' una frase secca: "fonte solida", "fonte debole", "fonte irrilevante", "fonte non verificabile".
- "notes" e' un commento di 1-2 frasi che giustifica score+verdict.`,
    userPrompt: `Claim: "${claim}"
Fonte: ${sourceUrl}

Valuta.`,
    jsonOutput: true,
    temperature: 0.2,
    timeoutMs: 30_000,
  });

  const parsed = parseLlmJson<RawFactCheck>(text);
  const scoreNum = Number(parsed.score);
  const score = Number.isFinite(scoreNum)
    ? Math.max(0, Math.min(10, Math.round(scoreNum)))
    : 5;
  const verdict =
    typeof parsed.verdict === 'string' && parsed.verdict.length > 0
      ? parsed.verdict.slice(0, 80)
      : 'non valutabile';
  const notes =
    typeof parsed.notes === 'string' ? parsed.notes.slice(0, 400) : '';

  return {
    tool: 'fact_check',
    claim,
    sourceUrl,
    score,
    verdict,
    notes,
  };
}
