# Progetto: Debate Arena — Dibattito tra Agenti AI con Tool

## Obiettivo
Webapp dove due agenti caratterizzati ("L'Ottimista Tech" vs "Lo Scettico Critico")
dibattono un tema scelto dall'utente, usando tool reali (web search, codice, 
grafici, fact-check), con scoring live di un agente-giudice e verdetto finale.

## Stack tecnico
- Frontend: React + Vite + TypeScript
- Styling: TailwindCSS + Framer Motion (per animazioni bolle/transizioni)
- Charts: Recharts (per grafici generati live dagli agenti)
- LLM: Google Gemini API (gemini-2.0-flash)
- Tool web search: Tavily API (semplice, gratuita fino a tot/mese)
- Code execution: sandbox JS in iframe sandboxed o Pyodide per Python
- State: Zustand

## Agenti

### 🚀 L'Ottimista Tech
Personalità: Entusiasta, visionario, cita Kurzweil, parla di esponenziali, 
crede nel progresso. Tono energico ma argomentato.

### 🧐 Lo Scettico Critico  
Personalità: Analitico, cita storia dei fallimenti tech, attento ai bias, 
chiede evidenze rigorose. Tono pacato ma incisivo.

### ⚖️ Il Giudice
Personalità: Neutrale, accademico. Valuta su 4 assi:
- Qualità argomentativa (logica, struttura)
- Solidità delle fonti (web search, fact-check)
- Uso dei dati (grafici, calcoli)
- Capacità di replica all'avversario

## Tool disponibili per i debater
1. **web_search(query)** → cerca evidenze online via Tavily, ritorna 3-5 fonti
2. **execute_code(code)** → esegue JS in sandbox per calcoli/simulazioni
3. **create_chart(data, type)** → genera grafico Recharts mostrato nel pannello
4. **fact_check(claim, source_url)** → valuta affidabilità di una fonte
5. **citation_memory** → ogni agente ha memoria delle citazioni raccolte, 
   richiamabili nei turni successivi

## Fasi del dibattito (8 turni totali)
1. **Apertura** (1 turno ciascuno): posizione iniziale, no tool
2. **Ricerca** (1 turno ciascuno): possono solo usare web_search per raccogliere munizioni
3. **Confronto** (2 turni ciascuno alternati): possono usare TUTTI i tool, attaccare l'avversario
4. **Chiusura** (1 turno ciascuno): sintesi finale, no tool nuovi

## UI Layout
┌────────────────────────────────────────────────────────────────┐
│  TEMA: [input testo]  POSIZIONI: [auto|manuale]   [START]      │
├──────────────────┬────────────────────────┬────────────────────┤
│  🚀 OTTIMISTA    │      ARENA CENTRALE    │  🧐 SCETTICO       │
│                  │                        │                    │
│ Pensiero live:   │   Bolla dialogo Avatar │  Pensiero live:    │
│ "Cerco dati su.."│      Ottimista         │  "Devo contrastare"│
│                  │   ◀ ▶ alternato        │                    │
│ Tool in corso:   │      Avatar Scettico   │  Tool in corso:    │
│ 🔍 web_search    │                        │  📊 create_chart   │
│                  │   Fase: CONFRONTO 3/8  │                    │
│ Citazioni (3):   │                        │  Citazioni (5):    │
│ • Fonte 1...     │   Grafici generati ⬇  │  • Fonte A...      │
│ • Fonte 2...     │   [Recharts inline]    │  • Fonte B...      │
│                  │                        │                    │
├──────────────────┴────────────────────────┴────────────────────┤
│  ⚖️ GIUDICE — SCORING LIVE                                     │
│  Ottimista:  Argomenti ████░ Fonti ███░░ Dati ██░░ Replica ███░│
│  Scettico:   Argomenti ████░ Fonti ████░ Dati ███░ Replica ██░░│
│  Commento giudice (live): "Lo Scettico porta dati più solidi.."│
└────────────────────────────────────────────────────────────────┘

## Feature must-have
- [ ] Input tema libero da utente
- [ ] Assegnazione automatica posizioni (LLM decide chi sostiene cosa)
- [ ] Loop turni con fasi chiare e visibili
- [ ] Streaming dei pensieri agente (mostrare il ragionamento mentre arriva)
- [ ] Tool calls visibili con animazione (icon che pulsa + risultato che appare)
- [ ] Bolle dialogo animate con Framer Motion
- [ ] Grafici Recharts inline quando un agente li genera
- [ ] Memoria citazioni persistente per agente
- [ ] Scoring 4-assi aggiornato dopo ogni turno dal giudice
- [ ] Verdetto finale motivato del giudice
- [ ] Trascrizione completa esportabile (per follow-up post-demo)

## Feature wow
- [ ] Avatar animati con espressioni che cambiano (felice/concentrato/sorpreso)
- [ ] Sound design: tasti meccanici quando scrivono, "ding" su tool result
- [ ] Modalità "lente di ingrandimento" su un tool result per zoom didattico
- [ ] Replay dibattito con velocità regolabile
- [ ] Poll pubblico opzionale (chi ha vinto secondo voi?)

## Prompt template Debater (esempio Scettico)
SYSTEM:
"Sei Lo Scettico Critico in un dibattito. Sei analitico, rigoroso, citi 
sempre fonti, attento ai bias cognitivi e ai fallimenti storici delle 
previsioni tech. Posizione assegnata: {position}. Fase corrente: {phase}. 
Tool disponibili in questa fase: {available_tools}.
Output JSON:
{ thinking: 'ragionamento interno', 
  tool_calls: [{ tool: '...', args: {...} }],
  speech: 'cosa dici ad alta voce',
  attacks_opponent: 'eventuale riferimento ad argomento avversario' }"

USER: "Tema: {tema}. Storia dibattito finora: {history}. 
       Citazioni che hai raccolto: {citations}. Il tuo turno."

## Prompt template Giudice
SYSTEM:
"Sei un giudice accademico imparziale. Valuta l'ultimo turno appena concluso 
su 4 assi (0-10 ciascuno): logical_quality, source_solidity, data_usage, 
counter_argumentation. Output JSON:
{ ottimista: { logical: N, sources: N, data: N, counter: N },
  scettico: { logical: N, sources: N, data: N, counter: N },
  commentary: 'breve commento del turno' }"

## Setup iniziale
1. Inizializza Vite + React + TS + Tailwind
2. Installa: framer-motion, recharts, zustand, @google/generative-ai
3. Struttura: /src/{agents,judge,tools,ui,store,debate-loop}
4. Implementa debate loop in puro stato (no UI) e testa via console
5. Poi UI a 3 colonne
6. Aggiungi tool uno per uno (parti da web_search)
7. Polish con animazioni Framer Motion alla fine

## Note operative
- Chiave Gemini in .env, chiave Tavily idem
- Stream risposte LLM se possibile (Gemini supporta streaming) per effetto "pensiero che si forma"
- Logga tutto in console + esportabile JSON