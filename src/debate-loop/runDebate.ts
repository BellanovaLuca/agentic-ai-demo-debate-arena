import { newId } from '../lib/ids';
import { createLogger } from '../lib/logger';
import { sleep } from '../lib/timeout';
import { useDebateStore } from '../store/debateStore';
import type { ChartSpec, DebateConfig } from '../types';
import { executeDebaterTurn } from './debaterTurn';
import { emitVerdict, evaluateTurn } from './judgeRunner';
import { assignPositions } from './positionAssignment';
import { buildSchedule } from './schedule';

const log = createLogger('debate-loop');

export class CancelledError extends Error {
  constructor() {
    super('Dibattito interrotto dall\'utente.');
    this.name = 'CancelledError';
  }
}

// Pausa "leggibile" base (ms) tra la fine di un turno e l'inizio del prossimo.
// Viene scalata dal moltiplicatore di velocita scelto dall'utente.
const BASE_INTER_TURN_DELAY_MS = 2400;

// Garantisce che alla fine del dibattito sia sempre presente almeno un
// grafico, anche se gli agenti non hanno chiamato create_chart. E' una
// scelta esplicita: serve a dimostrare la capability "create_chart" nella
// demo. La sintesi e' un grafico a barre dei punteggi cumulativi per asse.
function ensureChartCapabilityShown(): void {
  const state = useDebateStore.getState();
  if (Object.keys(state.chartsById).length > 0) return;

  const cum = state.cumulativeScore;
  const data = [
    { asse: 'Logica', Ottimista: cum.optimist.logical, Scettico: cum.skeptic.logical },
    { asse: 'Fonti', Ottimista: cum.optimist.sources, Scettico: cum.skeptic.sources },
    { asse: 'Dati', Ottimista: cum.optimist.data, Scettico: cum.skeptic.data },
    { asse: 'Replica', Ottimista: cum.optimist.counter, Scettico: cum.skeptic.counter },
  ];

  // Recharts disegna comunque la prima yKey; serve solo come fallback
  // demo, non come grafico analitico definitivo.
  const chart: ChartSpec = {
    id: newId('chart'),
    type: 'bar',
    title: 'Sintesi punteggi cumulativi per asse',
    xKey: 'asse',
    yKey: 'Ottimista',
    data,
    agent: 'optimist',
    createdAt: Date.now(),
  };
  useDebateStore.getState().addChart(chart);
  log.info('chart fallback iniettato (nessun grafico generato dagli agenti)');
}

export interface RunDebateOptions {
  topic: string;
  positions?: DebateConfig['positions'] | null;
}

// Aspetta finche lo store ha isPaused=true. Se l'utente preme Stop esce
// con CancelledError. Il polling e' ogni 150ms — basso impatto.
async function waitWhilePausedOrThrow(): Promise<void> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const s = useDebateStore.getState();
    if (s.cancelRequested) throw new CancelledError();
    if (!s.isPaused) return;
    await sleep(150);
  }
}

function currentInterTurnDelay(): number {
  const speed = useDebateStore.getState().speed;
  return Math.round(BASE_INTER_TURN_DELAY_MS / speed);
}

export async function runDebate(options: RunDebateOptions): Promise<void> {
  const { topic, positions = null } = options;

  if (!topic.trim()) {
    throw new Error('Tema mancante.');
  }

  const store = useDebateStore.getState();
  store.reset();
  store.setStatus('configuring');

  try {
    await waitWhilePausedOrThrow();
    const resolvedPositions = positions ?? (await assignPositions(topic));
    log.info('positions ready', resolvedPositions);

    const config: DebateConfig = { topic, positions: resolvedPositions };
    useDebateStore.getState().setConfig(config);

    // Snapshot dello schedule attivo per questo run, in base alla scelta
    // dell'utente. Cosi cambiare confrontoRounds a meta dibattito non
    // rompe nulla.
    const schedule = buildSchedule(
      useDebateStore.getState().confrontoRounds,
    );
    useDebateStore.getState().setActiveSchedule(schedule);
    useDebateStore.getState().setStatus('running');

    for (let i = 0; i < schedule.length; i++) {
      await waitWhilePausedOrThrow();
      const step = schedule[i];
      if (!step) continue;
      useDebateStore.getState().setCurrentStepIndex(i);

      const position = resolvedPositions[step.agent];

      const turn = await executeDebaterTurn({
        agent: step.agent,
        phase: step.phase,
        availableTools: step.availableTools,
        position,
        topic,
        stepIndex: i,
        totalSteps: schedule.length,
      });

      // Se l'utente ha premuto Stop mentre il turno girava, scartiamo
      // l'output e usciamo subito invece di committare e proseguire.
      if (useDebateStore.getState().cancelRequested) throw new CancelledError();

      useDebateStore.getState().appendTurn(turn);

      try {
        const evaluation = await evaluateTurn({
          topic,
          history: useDebateStore.getState().turns,
          lastTurn: turn,
        });
        useDebateStore.getState().applyJudgeEval(turn.id, evaluation);
      } catch (err) {
        log.warn(`judge failed on turn ${i + 1}, continuo`, err);
      }

      if (i < schedule.length - 1) {
        await sleep(currentInterTurnDelay());
      }
    }

    await waitWhilePausedOrThrow();
    ensureChartCapabilityShown();
    const finalState = useDebateStore.getState();
    const verdict = await emitVerdict({
      topic,
      history: finalState.turns,
      cumulativeScore: finalState.cumulativeScore,
    });
    useDebateStore.getState().setVerdict(verdict);
    log.info('debate done', { winner: verdict.winner });
  } catch (err) {
    if (err instanceof CancelledError) {
      log.info('debate cancelled by user');
      useDebateStore.getState().setStatus('cancelled', null);
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    log.error('debate failed', message);
    useDebateStore.getState().setStatus('error', message);
    throw err;
  }
}

if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__runDebate = runDebate;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__debateStore = useDebateStore;
}
