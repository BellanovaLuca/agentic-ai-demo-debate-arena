import { newId } from '../lib/ids';
import { createLogger } from '../lib/logger';
import type { ChartSpec } from '../types';
import type { CreateChartResult, ToolContext } from './types';

const log = createLogger('tool:create_chart');

const ALLOWED_TYPES: ReadonlySet<ChartSpec['type']> = new Set([
  'line',
  'bar',
  'pie',
]);

// Validazione strict dello spec del grafico (CLAUDE.md 2.7: validare i bordi).
// Rifiuta dati malformati invece di provare a "salvarli".
export function runCreateChart(
  args: Record<string, unknown>,
  ctx: ToolContext,
): CreateChartResult {
  const type = String(args.type ?? '').toLowerCase() as ChartSpec['type'];
  if (!ALLOWED_TYPES.has(type)) {
    throw new Error(
      `create_chart: "type" deve essere uno tra ${[...ALLOWED_TYPES].join(', ')}.`,
    );
  }

  const title =
    typeof args.title === 'string' && args.title.trim().length > 0
      ? args.title.trim().slice(0, 120)
      : 'Grafico';

  const xKey =
    typeof args.xKey === 'string' && args.xKey.trim().length > 0
      ? args.xKey.trim()
      : 'label';

  const yKey =
    typeof args.yKey === 'string' && args.yKey.trim().length > 0
      ? args.yKey.trim()
      : 'value';

  const rawData = Array.isArray(args.data) ? args.data : [];
  if (rawData.length === 0) {
    throw new Error('create_chart: "data" deve essere un array non vuoto.');
  }
  if (rawData.length > 40) {
    throw new Error('create_chart: troppi punti (max 40).');
  }

  const data: ChartSpec['data'] = [];
  for (const row of rawData) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const xRaw = r[xKey];
    const yRaw = r[yKey];
    if (xRaw === undefined || yRaw === undefined) continue;
    const xVal = typeof xRaw === 'number' ? xRaw : String(xRaw).slice(0, 40);
    const yNum = typeof yRaw === 'number' ? yRaw : Number(yRaw);
    if (!Number.isFinite(yNum)) continue;
    data.push({ [xKey]: xVal, [yKey]: yNum });
  }

  if (data.length === 0) {
    throw new Error(
      `create_chart: dopo la validazione nessun punto e' utilizzabile (controlla xKey="${xKey}", yKey="${yKey}").`,
    );
  }

  const chart: ChartSpec = {
    id: newId('chart'),
    type,
    title,
    xKey,
    yKey,
    data,
    agent: ctx.agent,
    createdAt: Date.now(),
  };

  log.info(`chart ${type} "${title}" ${data.length} pt`);

  return { tool: 'create_chart', chart };
}
