import type { Turn } from '../types';
import { AGENTS } from '../types';

// Prompt per il giudice. Due chiamate:
// 1) evalTurn — dopo ogni turno, valuta su 4 assi (0-10) per AMBEDUE gli agenti
//    (l'asse "counter" e' tipicamente solo per l'agente che ha appena parlato).
// 2) finalVerdict — alla fine, sintesi e vincitore.

export function buildJudgeTurnPrompt(args: {
  topic: string;
  history: ReadonlyArray<Turn>;
  lastTurn: Turn;
}): { systemInstruction: string; userPrompt: string } {
  const { topic, history, lastTurn } = args;

  const transcript = history
    .map((t) => {
      const a = AGENTS[t.agent];
      return `[Turno ${t.index + 1} — ${a.shortLabel}, ${t.phase}]\n${t.speech}`;
    })
    .join('\n\n');

  const me = AGENTS[lastTurn.agent];

  return {
    systemInstruction: `Sei un giudice accademico imparziale di un dibattito strutturato.
TUTTO l'output testuale che produci DEVE essere in ITALIANO. Qualunque
testo in inglese o in altre lingue verra' considerato output non valido.

Valuti l'ultimo turno appena concluso su 4 assi (interi 0-10 ciascuno):
- logical: qualita logica e struttura argomentativa
- sources: solidita delle fonti citate (URL reali, autorita, freschezza)
- data: uso di dati quantitativi (numeri, calcoli, grafici)
- counter: capacita di rispondere all'avversario (solo per l'agente che ha appena parlato; per l'altro metti 0)

Rispondi SOLO con JSON valido secondo schema:
{
  "optimist": { "logical": N, "sources": N, "data": N, "counter": N },
  "skeptic":  { "logical": N, "sources": N, "data": N, "counter": N },
  "commentary": "1-2 frasi di commento sul turno, OBBLIGATORIAMENTE in italiano"
}

Sii severo: non dare 10 a meno che il turno sia eccezionale.
Punteggi assegnati SOLO sull'ultimo turno (non cumulativi).
Per l'agente che NON ha parlato in questo turno: tutti gli assi a 0.`,
    userPrompt: `Tema del dibattito: ${topic}

Storia completa fino a ora:
${transcript}

Ultimo turno (di ${me.name}, fase ${lastTurn.phase}):
"""
${lastTurn.speech}
"""

Tool calls dell'ultimo turno: ${lastTurn.toolCalls.length}
Citazioni raccolte nell'ultimo turno: ${lastTurn.citationsCollected.length}
Grafici creati nell'ultimo turno: ${lastTurn.chartsCreated.length}

Valuta secondo lo schema obbligatorio.`,
  };
}

export function buildVerdictPrompt(args: {
  topic: string;
  history: ReadonlyArray<Turn>;
  cumulativeScore: {
    optimist: { logical: number; sources: number; data: number; counter: number };
    skeptic: { logical: number; sources: number; data: number; counter: number };
  };
}): { systemInstruction: string; userPrompt: string } {
  const { topic, history, cumulativeScore } = args;

  const transcript = history
    .map((t) => {
      const a = AGENTS[t.agent];
      return `[Turno ${t.index + 1} — ${a.shortLabel}, ${t.phase}]\n${t.speech}`;
    })
    .join('\n\n');

  const total = (s: typeof cumulativeScore.optimist): number =>
    s.logical + s.sources + s.data + s.counter;

  return {
    systemInstruction: `Sei un giudice accademico imparziale. Hai osservato l'intero dibattito.
Devi emettere un verdetto finale motivato.

VINCOLO LINGUISTICO TASSATIVO: TUTTO il testo che produci ("reasoning" e
ogni elemento di "highlights") deve essere scritto in ITALIANO corretto.
Qualunque parola, frase o riga in inglese o in altra lingua rende
l'output NON VALIDO e verra' rifiutato.

Rispondi SOLO con JSON:
{
  "winner": "optimist" | "skeptic" | "tie",
  "reasoning": "3-5 frasi IN ITALIANO che spiegano la decisione, citando momenti specifici del dibattito",
  "highlights": ["frase IN ITALIANO 1", "frase IN ITALIANO 2", "frase IN ITALIANO 3"]
}

Il vincitore non deve corrispondere meccanicamente al punteggio piu alto:
i punteggi sono guida, non sentenza. Ma se la differenza e grande
(>10 punti totali), e' difficile motivare il contrario.`,
    userPrompt: `Tema: ${topic}

Punteggi cumulativi dopo tutti i turni:
- Ottimista: logical=${cumulativeScore.optimist.logical}, sources=${cumulativeScore.optimist.sources}, data=${cumulativeScore.optimist.data}, counter=${cumulativeScore.optimist.counter} (totale ${total(cumulativeScore.optimist)})
- Scettico:  logical=${cumulativeScore.skeptic.logical}, sources=${cumulativeScore.skeptic.sources}, data=${cumulativeScore.skeptic.data}, counter=${cumulativeScore.skeptic.counter} (totale ${total(cumulativeScore.skeptic)})

Trascrizione completa:
${transcript}

Emetti il verdetto.`,
  };
}
