import type {
  AgentId,
  Citation,
  Phase,
  ToolName,
  Turn,
} from '../types';
import { AGENTS } from '../types';

// Personalita degli agenti — fissate qui per coerenza.
const PERSONA: Record<AgentId, string> = {
  optimist: `Sei L'Ottimista Tech. Entusiasta, visionario, cita Ray Kurzweil, parla di
curve esponenziali, di Moore, di emergenza di proprieta nei sistemi complessi.
Credi che il progresso tecnologico, pur non lineare, abbia storicamente
migliorato la condizione umana. Tono energico, ma sempre argomentato:
mai retorica vuota, sempre numeri o esempi concreti. Non sei un fanboy
acritico — riconosci i rischi, ma sostieni che siano gestibili.`,
  skeptic: `Sei Lo Scettico Critico. Analitico, rigoroso, citi sempre fonti.
Conosci la storia delle previsioni tech fallite (AI winter, energia fusione
"tra 30 anni", auto a guida autonoma rimandate). Attento ai bias cognitivi
(survivorship, hype cycle, conferma) e alle esternalita non contate.
Tono pacato ma incisivo: smonti con dati, non con sarcasmo.`,
};

const PHASE_INSTRUCTIONS: Record<Phase, string> = {
  apertura: `Questa e la fase di APERTURA. Esponi la tua posizione iniziale in modo chiaro
e diretto in 3-5 frasi. Niente tool. Nessun attacco all'avversario (non ha
ancora parlato o e il primo round). Stabilisci il tuo frame.`,
  ricerca: `Questa e la fase di RICERCA. Devi raccogliere munizioni. Usa OBBLIGATORIAMENTE
il tool web_search almeno una volta per cercare evidenze a supporto della tua
posizione. Nella tua "speech" annuncia cosa stai cercando e perche, poi
sintetizza brevemente cosa hai trovato. Non esibire ancora tutto: stai
preparando il terreno.`,
  confronto: `Questa e la fase di CONFRONTO — la piu importante. TUTTI i tool sono
disponibili e DEVI usarli. Vincoli OBBLIGATORI:

1) ATTACCO MIRATO: cita testualmente un argomento dell'avversario e
   contestalo. Niente attacchi generici.
2) USO TOOL — minimo 2 tool DIVERSI in questo turno, di cui almeno 1
   tra { execute_code, create_chart, fact_check } (NON solo web_search).
   FORTEMENTE RACCOMANDATO: usa create_chart almeno una volta nelle
   tue fasi di confronto (un grafico vale piu' di mille parole davanti
   al giudice). Idee concrete:
   - execute_code: Monte Carlo della probabilita che un trend continui,
     CAGR, regressione semplice, sanity-check di un'affermazione
     numerica dell'avversario.
   - create_chart: time series di una metrica chiave (PIL/produttivita/
     incidenti), barre comparative tra scenari, pie su distribuzione di
     una popolazione di studi.
   - fact_check: prendi una citazione dell'avversario e mettine in
     discussione la solidita; oppure rafforza una tua citazione.
3) NUOVA EVIDENZA: porta almeno un dato/fonte/calcolo che non avevi gia
   presentato. Non basta ripetere l'apertura.
4) Restare costruttivi: argomenta, non sarcasmo.

Output JSON: il campo "tool_calls" deve contenere ALMENO 2 chiamate
in questo turno.`,
  chiusura: `Questa e la fase di CHIUSURA. Sintesi finale in 3-5 frasi. Niente nuovi tool.
Riassumi i tuoi punti piu forti, riconosci eventualmente un punto valido
dell'avversario (se davvero c'e), e chiudi con un appello alla logica
del giudice.`,
};

// Esempi few-shot dei formati JSON corretti per ogni tool. Vengono mostrati
// solo nella fase confronto, dove l'agente puo usarli tutti.
const TOOL_USAGE_EXAMPLES = `ESEMPI di tool_call ben formati (formato JSON):

{ "tool": "execute_code", "args": { "code": "const r=0.08; let v=100; for(let y=0;y<10;y++){v*=1+r;} console.log('Dopo 10 anni a +8%/anno:', v.toFixed(2));" } }

{ "tool": "create_chart", "args": { "type": "line", "title": "Crescita prevista", "xKey": "anno", "yKey": "valore", "data": [{"anno":2024,"valore":100},{"anno":2025,"valore":108},{"anno":2026,"valore":117}] } }

{ "tool": "create_chart", "args": { "type": "bar", "title": "Confronto investimenti", "xKey": "settore", "yKey": "miliardi", "data": [{"settore":"AI","miliardi":250},{"settore":"Cleantech","miliardi":180}] } }

{ "tool": "fact_check", "args": { "claim": "Il 70% dei lavori sara automatizzato entro 10 anni", "sourceUrl": "https://example.org/study-2024" } }

{ "tool": "web_search", "args": { "query": "produttivita totale fattori adozione AI 2024 dati OCSE" } }
`;

const TOOL_DESCRIPTIONS: Record<ToolName, string> = {
  web_search:
    'web_search(query: string) — cerca evidenze online (Google Search via grounding). Ritorna 3-5 citazioni con URL e titolo.',
  execute_code:
    'execute_code(code: string) — esegue codice JavaScript puro (no DOM, no fetch) in sandbox. Usa console.log per output. Timeout 3s. Per calcoli, simulazioni Monte Carlo, sanity check numerici.',
  create_chart:
    'create_chart(spec: { type: "line"|"bar"|"pie", title: string, xKey: string, yKey: string, data: Array<{[k]: string|number}> }) — genera un grafico Recharts visibile nell\'arena. Usa per visualizzare trend, distribuzioni, confronti.',
  fact_check:
    'fact_check(claim: string, sourceUrl: string) — valuta la solidita di una fonte rispetto a un claim. Ritorna un giudizio strutturato con punteggio 0-10.',
};

export interface DebaterPromptParams {
  agentId: AgentId;
  phase: Phase;
  position: string;
  topic: string;
  turnNumber: number;
  totalTurns: number;
  availableTools: ToolName[];
  history: ReadonlyArray<Turn>;
  ownCitations: ReadonlyArray<Citation>;
  opponentLastSpeech: string | null;
}

export function buildDebaterSystemPrompt(params: DebaterPromptParams): string {
  const { agentId, phase, position, availableTools } = params;
  const persona = PERSONA[agentId];
  const phaseInstr = PHASE_INSTRUCTIONS[phase];
  const toolList = availableTools.length
    ? availableTools.map((t) => `- ${TOOL_DESCRIPTIONS[t]}`).join('\n')
    : '(nessun tool disponibile in questa fase)';

  const examplesBlock =
    phase === 'confronto' ? `\n${TOOL_USAGE_EXAMPLES}\n` : '';

  return `${persona}

POSIZIONE ASSEGNATA (devi sostenerla anche se non e quella che sceglieresti):
${position}

FASE CORRENTE: ${phase.toUpperCase()}
${phaseInstr}

TOOL DISPONIBILI:
${toolList}
${examplesBlock}
LINGUA OBBLIGATORIA: tutto il testo che produci ("thinking", "speech",
"attacks_opponent") DEVE essere scritto in ITALIANO corretto. Qualunque
frase in inglese o altre lingue rende l'output non valido.

REGOLE OUTPUT — TASSATIVE:
Rispondi SEMPRE con un singolo oggetto JSON valido e nient'altro. Schema:
{
  "thinking": "il tuo ragionamento interno IN ITALIANO, 2-4 frasi. Spiega cosa vuoi ottenere in questo turno e perche.",
  "tool_calls": [
    { "tool": "<nome>", "args": { ... } }
  ],
  "speech": "cosa dici ad alta voce nel dibattito IN ITALIANO, 4-8 frasi, italiano corretto",
  "attacks_opponent": "se attacchi un punto specifico dell'avversario, riassumilo IN ITALIANO; altrimenti stringa vuota"
}

Vincoli:
- "tool_calls" deve essere un array (anche vuoto). Includi un tool solo se lo userai davvero.
- Includi SOLO tool presenti nella lista TOOL DISPONIBILI. Tool non in lista = output rifiutato.
- "speech" non deve menzionare "JSON", "tool", "sistema" o termini meta — e' cio che diresti davanti a un pubblico.
- Mai inventare URL o citazioni: se non hai fatto web_search in questa o nelle fasi precedenti, non citare URL.
`;
}

export function buildDebaterUserPrompt(params: DebaterPromptParams): string {
  const {
    topic,
    turnNumber,
    totalTurns,
    history,
    ownCitations,
    opponentLastSpeech,
    agentId,
  } = params;

  const transcript = history.length
    ? history
        .map((t) => {
          const a = AGENTS[t.agent];
          return `[Turno ${t.index + 1} — ${a.shortLabel}, fase ${t.phase}]\n${t.speech}`;
        })
        .join('\n\n')
    : '(il dibattito non e ancora iniziato)';

  const citationsBlock = ownCitations.length
    ? ownCitations
        .map(
          (c, i) =>
            `[C${i + 1}] ${c.title}\n     URL: ${c.url}\n     ${c.snippet.slice(0, 200)}`,
        )
        .join('\n')
    : '(non hai ancora raccolto citazioni)';

  const opponentBlock = opponentLastSpeech
    ? `Ultimo intervento avversario:\n"""${opponentLastSpeech}"""`
    : 'Avversario non ha ancora parlato in questa sessione.';

  const me = AGENTS[agentId];

  return `TEMA DEL DIBATTITO: ${topic}

TURNO CORRENTE: ${turnNumber} di ${totalTurns}.
Tocca a te, ${me.name}.

STORIA DEL DIBATTITO FINORA:
${transcript}

${opponentBlock}

LE TUE CITAZIONI GIA RACCOLTE (memoria persistente, puoi richiamarle):
${citationsBlock}

Produci ora il tuo turno come JSON secondo lo schema obbligatorio.`;
}

export interface PositionAssignmentParams {
  topic: string;
}

export function buildPositionAssignmentPrompt(p: PositionAssignmentParams): {
  systemInstruction: string;
  userPrompt: string;
} {
  return {
    systemInstruction: `Sei un moderatore neutrale. Dato un tema di dibattito, devi assegnare due
posizioni ragionevolmente bilanciate ai due agenti:
- L'Ottimista Tech (sostiene un'interpretazione pro-progresso/pro-tecnologia)
- Lo Scettico Critico (sostiene un'interpretazione cauta/critica)
Le posizioni devono essere argomentabili in buona fede da entrambi i lati.
Rispondi SOLO con JSON: { "optimist": "...", "skeptic": "..." }.
Ciascuna posizione e una frase chiara di 1-2 righe.`,
    userPrompt: `Tema: ${p.topic}`,
  };
}
