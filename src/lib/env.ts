// Settings centralizzato, validato all'import. CLAUDE.md sez. 5.5.
// Se manca la chiave Gemini ritorna `null` invece di crashare,
// cosi la UI puo mostrare un messaggio chiaro all'utente.

export interface AppEnv {
  geminiApiKey: string | null;
  geminiModel: string;
  debug: boolean;
}

function readEnv(): AppEnv {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY;
  const key =
    typeof rawKey === 'string' && rawKey.trim().length > 0
      ? rawKey.trim()
      : null;

  const model =
    typeof import.meta.env.VITE_GEMINI_MODEL === 'string' &&
    import.meta.env.VITE_GEMINI_MODEL.length > 0
      ? import.meta.env.VITE_GEMINI_MODEL
      : 'gemini-2.0-flash';

  const debug = import.meta.env.VITE_DEBUG === 'true';

  return {
    geminiApiKey: key,
    geminiModel: model,
    debug,
  };
}

export const APP_ENV: AppEnv = readEnv();
