# Debate Arena

Webapp dove due agenti AI ("L'Ottimista Tech" 🚀 vs "Lo Scettico Critico" 🧐) dibattono un tema scelto dall'utente, usando tool reali (Google Search via grounding, sandbox JS, generazione grafici Recharts, fact-check), con scoring live di un agente-giudice e verdetto finale.

## Quick start

```bash
# 1. installa dipendenze
npm install

# 2. crea il file .env locale
cp .env.example .env

# 3. inserisci la tua chiave Gemini in .env (https://aistudio.google.com/apikey)
#    VITE_GEMINI_API_KEY=sk-...

# 4. avvia il dev server
npm run dev
```

Apri il browser sull'URL stampato da Vite (di default `http://localhost:5173`, ma se quella porta e' occupata Vite ne sceglie un'altra automaticamente).

Inserisci un tema (o usa il bottone `random` per uno di esempio), premi **START**, e osserva il dibattito.

## Stack

| | |
|---|---|
| **Frontend** | React 18 + Vite + TypeScript (strict) |
| **Styling** | TailwindCSS + Framer Motion |
| **Charts** | Recharts |
| **State** | Zustand |
| **LLM** | Google Gemini 2.0 Flash via `@google/genai` |
| **Web search** | Gemini Google Search grounding (no Tavily, no chiave extra) |
| **Code sandbox** | iframe con `sandbox="allow-scripts"` + postMessage |

## Architettura

```
src/
  agents/         personalita, prompt template
  judge/          prompt template del giudice
  tools/          web_search, execute_code, create_chart, fact_check + dispatch
  debate-loop/    schedule, debaterTurn, judgeRunner, runDebate (orchestratore)
  store/          Zustand store (fonte unica di verita)
  ui/             componenti React + animazioni
  lib/            gemini client, env, logger, ids, timeout, jsonParse
```

### Flow di un turno

1. `runDebate(topic)` resetta lo store, assegna posizioni via LLM, parte il loop.
2. Per ogni step nello `DEBATE_SCHEDULE` (8 in totale):
   - `executeDebaterTurn` chiama Gemini in **streaming**, estrae i campi `thinking` e `speech` parzialmente per aggiornare la UI live.
   - Parsa il JSON, esegue i `tool_calls` dichiarati uno per uno (badge animato nell'UI per ogni tool attivo).
   - Salva il turno, aggiunge citazioni e charts allo store.
3. `evaluateTurn` chiama il giudice per scorare il turno appena concluso (4 assi: argomenti, fonti, dati, replica).
4. A fine dibattito, `emitVerdict` produce il verdetto finale motivato.

### Fasi

| Fase | Turni | Tool disponibili |
|---|---|---|
| Apertura | 2 (1 a testa) | nessuno |
| Ricerca | 2 (1 a testa) | `web_search` |
| Confronto | 2 (1 a testa) | tutti |
| Chiusura | 2 (1 a testa) | nessuno |

Lo schedule e' in `src/debate-loop/schedule.ts` — modifica li' per cambiare il numero/ordine dei turni.

### Sicurezza dei tool

- `execute_code` gira in iframe `sandbox="allow-scripts"` (no `allow-same-origin`): niente accesso al DOM padre, niente `fetch`, niente `localStorage`. Timeout hard a 3s. Cap su input (4 KB) e output (2 KB).
- `web_search` usa Gemini grounding: niente URL utente concatenato in shell o SQL.
- `create_chart` valida tipi, chiavi, e numero di punti prima di accettare lo spec.
- `fact_check` ragiona sull'URL ma non lo naviga davvero — onesta sulle assunzioni nel prompt.

### Nota su sicurezza in produzione

La chiave Gemini in questa demo gira direttamente nel browser (`import.meta.env.VITE_GEMINI_API_KEY`). Per un deployment reale serve un proxy backend che firma le chiamate, altrimenti la chiave finisce nel bundle pubblico. Vedi `src/lib/gemini.ts` per il commento di riferimento.

## Debug

- `npm run typecheck` — controllo TS strict
- `npm run build` — build di produzione
- In console del browser, in modalita dev, sono esposti:
  - `window.__runDebate({ topic: '...' })` per lanciare un dibattito programmaticamente
  - `window.__debateStore` per ispezionare/manipolare lo store
- `VITE_DEBUG=true` (default) attiva log estesi nei tool e nel client Gemini.

## Export

Il pulsante `Export` (header) scarica un JSON con tema, posizioni, turni, citazioni, charts, score cumulativi e verdetto.

## Limitazioni note (demo)

- Niente test automatici: il dibattito e' inerentemente non-deterministico (LLM); per test sensati servono mock dedicati.
- Sound design / replay con velocita / poll pubblico — fuori scope.
- Avatar con stati emotivi: implementati 5 mood (idle/thinking/speaking/toolRunning/confident); niente sprite animate.

## Licenza

Demo interna, non distribuita.
