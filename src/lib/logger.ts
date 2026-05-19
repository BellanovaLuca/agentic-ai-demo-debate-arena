import { APP_ENV } from './env';

// Logger leggero. CLAUDE.md 5.6: niente print, livelli espliciti,
// in dev tono friendly, in prod (build) si potrebbe spingere a JSON.

type Level = 'debug' | 'info' | 'warn' | 'error';

const ICON: Record<Level, string> = {
  debug: '·',
  info: 'ℹ',
  warn: '⚠',
  error: '✖',
};

function emit(level: Level, scope: string, msg: string, data?: unknown): void {
  if (level === 'debug' && !APP_ENV.debug) return;
  const prefix = `${ICON[level]} [${scope}]`;
  const fn =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : console.log;
  if (data !== undefined) fn(prefix, msg, data);
  else fn(prefix, msg);
}

export function createLogger(scope: string) {
  return {
    debug: (msg: string, data?: unknown) => emit('debug', scope, msg, data),
    info: (msg: string, data?: unknown) => emit('info', scope, msg, data),
    warn: (msg: string, data?: unknown) => emit('warn', scope, msg, data),
    error: (msg: string, data?: unknown) => emit('error', scope, msg, data),
  };
}

export type Logger = ReturnType<typeof createLogger>;
