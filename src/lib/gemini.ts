import { GoogleGenAI } from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';

import { APP_ENV } from './env';
import { createLogger } from './logger';
import { withTimeout } from './timeout';

// AVVISO SICUREZZA — CLAUDE.md 2.5:
// In una webapp di produzione la chiave Gemini NON deve essere esposta nel
// bundle frontend. Questo progetto e una demo locale: la chiave sta in .env
// e gira solo in dev. Per produzione: proxy backend che firma le chiamate.

const log = createLogger('gemini');

let client: GoogleGenAI | null = null;

export function getClient(): GoogleGenAI {
  if (client) return client;
  if (!APP_ENV.geminiApiKey) {
    throw new Error(
      'VITE_GEMINI_API_KEY mancante. Copia .env.example in .env e inserisci la chiave (https://aistudio.google.com/apikey).',
    );
  }
  client = new GoogleGenAI({ apiKey: APP_ENV.geminiApiKey });
  return client;
}

export interface GroundingChunk {
  uri: string;
  title: string;
  snippet?: string;
}

export interface GenerateOptions {
  systemInstruction: string;
  userPrompt: string;
  temperature?: number;
  enableSearchGrounding?: boolean;
  jsonOutput?: boolean;
  timeoutMs?: number;
  onChunk?: (delta: string, full: string) => void;
}

export interface GenerateResult {
  text: string;
  groundingChunks: GroundingChunk[];
  finishReason: string | null;
}

// Wrapper unico per tutte le chiamate Gemini.
// - streaming con callback (per UX "pensiero che si forma")
// - timeout esplicito (CLAUDE.md 3.2)
// - estrazione strutturata di grounding metadata
// - jsonOutput=true imposta responseMimeType=application/json
//
// Nota: con googleSearch grounding non possiamo passare responseSchema,
// ma responseMimeType=application/json e' supportato.
export async function generate(opts: GenerateOptions): Promise<GenerateResult> {
  const ai = getClient();
  const {
    systemInstruction,
    userPrompt,
    temperature = 0.8,
    enableSearchGrounding = false,
    jsonOutput = false,
    timeoutMs = 60_000,
    onChunk,
  } = opts;

  log.debug('generate start', {
    model: APP_ENV.geminiModel,
    grounding: enableSearchGrounding,
    json: jsonOutput,
  });

  const work = (async (): Promise<GenerateResult> => {
    const stream = await ai.models.generateContentStream({
      model: APP_ENV.geminiModel,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        temperature,
        ...(enableSearchGrounding ? { tools: [{ googleSearch: {} }] } : {}),
        ...(jsonOutput && !enableSearchGrounding
          ? { responseMimeType: 'application/json' }
          : {}),
      },
    });

    let full = '';
    let lastResponse: GenerateContentResponse | null = null;
    for await (const chunk of stream) {
      lastResponse = chunk;
      const t = chunk.text;
      if (t) {
        full += t;
        onChunk?.(t, full);
      }
    }

    const groundingChunks = extractGroundingChunks(lastResponse);
    const finishReason = lastResponse?.candidates?.[0]?.finishReason ?? null;

    log.debug('generate done', {
      chars: full.length,
      groundingCount: groundingChunks.length,
      finishReason,
    });

    return { text: full, groundingChunks, finishReason };
  })();

  return withTimeout(work, timeoutMs);
}

function extractGroundingChunks(
  resp: GenerateContentResponse | null,
): GroundingChunk[] {
  const gm = resp?.candidates?.[0]?.groundingMetadata;
  if (!gm) return [];
  const chunks = gm.groundingChunks ?? [];
  const out: GroundingChunk[] = [];
  for (const c of chunks) {
    const web = c.web;
    if (web?.uri) {
      out.push({
        uri: web.uri,
        title: web.title ?? web.uri,
      });
    }
  }
  return out;
}
