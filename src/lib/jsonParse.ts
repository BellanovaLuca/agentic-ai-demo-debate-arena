// Parser JSON robusto per output LLM.
// Gli LLM, anche con responseMimeType=application/json, talvolta circondano
// il JSON con markdown fences o testo extra. Questa funzione estrae il primo
// blocco JSON valido e lo parsa. Fallisce esplicitamente se non lo trova.

export function parseLlmJson<T = unknown>(raw: string): T {
  const trimmed = raw.trim();
  // Caso ideale: gia JSON.
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // continua
  }

  // Caso fence: ```json ... ```
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  if (fence?.[1]) {
    try {
      return JSON.parse(fence[1].trim()) as T;
    } catch {
      // continua
    }
  }

  // Ultimo tentativo: trova prima { e ultima } (o [ ]).
  const firstBrace = trimmed.search(/[{[]/);
  const lastBrace = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const slice = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice) as T;
    } catch {
      // fall through
    }
  }

  throw new Error(`Impossibile parsare JSON dall'output LLM: ${trimmed.slice(0, 200)}...`);
}
