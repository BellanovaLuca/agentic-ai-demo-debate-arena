import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  selectOwnCitations,
  useDebateStore,
} from '../store/debateStore';
import { AGENTS, type AgentId, type ToolCallRecord, type Turn } from '../types';
import { AVATAR_MOOD_LABEL, Avatar, type AvatarMood } from './Avatar';
import { CitationList } from './CitationList';
import { ToolBadge } from './ToolBadge';
import { TOOL_LABEL } from './icons';

interface Props {
  agent: AgentId;
  side: 'left' | 'right';
}

type TabKey = 'thinking' | 'tools' | 'citations';

// Pannello dell'agente: layout a tab per evitare che il "Pensiero live"
// (che puo' diventare lungo durante lo streaming) schiacci tool e citazioni.
// La tab attiva riceve sempre tutta l'altezza disponibile sotto l'header,
// con scroll interno dedicato.
export function AgentColumn({ agent, side }: Props) {
  const profile = AGENTS[agent];
  const liveThinking = useDebateStore((s) => s.liveThinking[agent]);
  const liveSpeech = useDebateStore((s) => s.liveSpeech[agent]);
  const activeTool = useDebateStore((s) => s.activeToolCall[agent]);
  const citations = useDebateStore(useShallow((s) => selectOwnCitations(s, agent)));
  const allTurns = useDebateStore(useShallow((s) => s.turns));
  const positions = useDebateStore((s) => s.config?.positions);
  const status = useDebateStore((s) => s.status);
  const turnsCount = allTurns.length;

  // Estrae i turni di questo agente, ognuno con i suoi tool calls.
  const agentTurns = useMemo(
    () => allTurns.filter((t) => t.agent === agent),
    [allTurns, agent],
  );

  const totalToolCalls = useMemo(
    () => agentTurns.reduce((acc, t) => acc + t.toolCalls.length, 0),
    [agentTurns],
  );

  const isCurrentAgent =
    status === 'running' &&
    turnsCount % 2 === (agent === 'optimist' ? 0 : 1);

  const mood: AvatarMood = activeTool
    ? 'toolRunning'
    : liveSpeech
      ? 'speaking'
      : liveThinking
        ? 'thinking'
        : status === 'completed'
          ? 'confident'
          : 'idle';

  const [activeTab, setActiveTab] = useState<TabKey>('thinking');

  // Badge "nuovo" per Citazioni e Strumenti quando l'utente non e' sulla tab.
  const [lastSeenCitations, setLastSeenCitations] = useState(citations.length);
  const [lastSeenTools, setLastSeenTools] = useState(totalToolCalls);
  useEffect(() => {
    if (activeTab === 'citations') setLastSeenCitations(citations.length);
    if (activeTab === 'tools') setLastSeenTools(totalToolCalls);
  }, [activeTab, citations.length, totalToolCalls]);
  const newCitations = Math.max(0, citations.length - lastSeenCitations);
  const newTools = Math.max(0, totalToolCalls - lastSeenTools);

  const isOptimist = agent === 'optimist';
  const themeAccent = isOptimist ? 'text-optimist-400' : 'text-skeptic-400';
  const themeDot = isOptimist ? 'bg-optimist-400' : 'bg-skeptic-400';
  const themeUnderline = isOptimist ? 'bg-optimist-500' : 'bg-skeptic-500';
  const themeRail = isOptimist
    ? 'from-optimist-500/60 via-optimist-500/15 to-transparent'
    : 'from-skeptic-500/60 via-skeptic-500/15 to-transparent';
  const themeGlow = isCurrentAgent
    ? isOptimist
      ? 'shadow-[0_0_0_1px_rgba(14,165,233,0.35),0_18px_60px_-30px_rgba(14,165,233,0.55)]'
      : 'shadow-[0_0_0_1px_rgba(168,85,247,0.35),0_18px_60px_-30px_rgba(168,85,247,0.55)]'
    : '';

  return (
    <motion.aside
      initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`panel relative flex h-full min-h-0 flex-col overflow-hidden ${themeGlow}`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 ${side === 'left' ? 'left-0' : 'right-0'} w-[3px] bg-gradient-to-b ${themeRail}`}
      />

      {/* Header dell'agente come "title card" centrata: avatar → nome →
          mood (IN ATTESA / STA PENSANDO …) → ruolo → posizione. */}
      <header className="shrink-0 border-b border-white/5 px-4 pb-3 pt-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <Avatar agent={agent} mood={mood} size={52} showMoodLabel={false} />
          <div className="flex items-center justify-center gap-2">
            <h2
              className={`font-display text-[16px] font-semibold leading-tight tracking-tight ${themeAccent}`}
            >
              {profile.name}
            </h2>
            {isCurrentAgent && (
              <motion.span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${themeDot} shadow-[0_0_8px_currentColor]`}
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            )}
          </div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {AVATAR_MOOD_LABEL[mood]}
          </p>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-slate-600">
            {profile.shortLabel}
          </p>
          {positions && (
            <p className="line-clamp-2 max-w-[28ch] text-[11.5px] leading-snug text-slate-300/90">
              <span className="text-slate-500">Posizione: </span>
              <span className="italic">&ldquo;{positions[agent]}&rdquo;</span>
            </p>
          )}
        </div>
      </header>

      {/* Tool ATTIVO — chip compatto + args wrappati sotto, sempre visibili */}
      <section className="shrink-0 border-b border-white/5 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Tool in esecuzione
          </span>
          <div className="min-w-0 flex-1">
            {activeTool ? (
              <ToolBadge call={activeTool} compact />
            ) : (
              <span className="text-[11px] italic text-slate-500">— nessuno attivo</span>
            )}
          </div>
        </div>
        {activeTool && (
          <p className="mt-1.5 break-words text-[11px] leading-snug text-slate-300/90">
            {formatToolArgs(activeTool) ?? (
              <span className="italic text-slate-500">— senza argomenti —</span>
            )}
          </p>
        )}
      </section>

      {/* Tab switcher */}
      <div className="shrink-0 border-b border-white/5 px-3 pt-2">
        <div role="tablist" className="flex gap-0.5">
          <TabButton
            label="Pensiero"
            active={activeTab === 'thinking'}
            onClick={() => setActiveTab('thinking')}
            underline={themeUnderline}
            indicator={liveThinking && !liveSpeech ? (
              <motion.span
                className={`h-1.5 w-1.5 rounded-full ${themeDot}`}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            ) : null}
          />
          <TabButton
            label="Strumenti"
            active={activeTab === 'tools'}
            onClick={() => setActiveTab('tools')}
            underline={themeUnderline}
            indicator={
              <span className="rounded bg-arena-bg px-1.5 py-0 font-mono text-[10px] text-slate-300">
                {totalToolCalls}
              </span>
            }
            badge={newTools > 0 && activeTab !== 'tools' ? newTools : 0}
          />
          <TabButton
            label="Citazioni"
            active={activeTab === 'citations'}
            onClick={() => setActiveTab('citations')}
            underline={themeUnderline}
            indicator={
              <span className="rounded bg-arena-bg px-1.5 py-0 font-mono text-[10px] text-slate-300">
                {citations.length}
              </span>
            }
            badge={newCitations > 0 && activeTab !== 'citations' ? newCitations : 0}
          />
        </div>
      </div>

      {/* Contenuto della tab attiva — occupa tutto lo spazio rimanente */}
      <div className="flex min-h-0 flex-1 flex-col">
        {activeTab === 'thinking' && (
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <p
              className={`whitespace-pre-wrap text-xs leading-relaxed text-slate-200 ${liveThinking && !liveSpeech ? 'streaming-caret' : ''}`}
            >
              {liveThinking ||
                (status === 'idle' ? (
                  <span className="italic text-slate-500">In attesa dello START…</span>
                ) : (
                  <span className="italic text-slate-500">In ascolto…</span>
                ))}
            </p>
          </div>
        )}
        {activeTab === 'tools' && (
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <ToolHistoryList agent={agent} turns={agentTurns} />
          </div>
        )}
        {activeTab === 'citations' && (
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <CitationList citations={citations} themeKey={profile.themeKey} />
          </div>
        )}
      </div>
    </motion.aside>
  );
}

function TabButton({
  label,
  active,
  onClick,
  underline,
  indicator,
  badge = 0,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  underline: string;
  indicator?: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative flex items-center gap-1.5 rounded-t-md px-2.5 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] transition-colors ${
        active ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <span>{label}</span>
      {indicator}
      {badge > 0 && (
        <span className="ml-0.5 rounded-full bg-amber-400/90 px-1.5 text-[9px] font-bold text-slate-900">
          +{badge}
        </span>
      )}
      {active && (
        <motion.span
          layoutId={`tab-underline-${label}`}
          className={`absolute inset-x-1 bottom-0 h-[2px] rounded-full ${underline}`}
        />
      )}
    </button>
  );
}

// Lista cronologica di tool richiamati da questo agente, raggruppati per turno.
function ToolHistoryList({
  agent,
  turns,
}: {
  agent: AgentId;
  turns: ReadonlyArray<Turn>;
}) {
  const turnsWithTools = turns.filter((t) => t.toolCalls.length > 0);
  if (turnsWithTools.length === 0) {
    return (
      <p className="text-[11px] italic text-slate-500">
        Nessun tool richiamato finora.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {turnsWithTools.map((t) => (
        <li key={t.id}>
          <div className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
            <span className="rounded bg-arena-bg px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
              T{t.index + 1}
            </span>
            <span className="text-slate-500">·</span>
            <span>{t.phase}</span>
            <span className="ml-auto font-mono text-[10px] text-slate-500">
              {t.toolCalls.length}
            </span>
          </div>
          <ul className="space-y-1.5">
            {t.toolCalls.map((call) => (
              <ToolHistoryItem key={call.id} call={call} agent={agent} />
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function ToolHistoryItem({
  call,
  agent,
}: {
  call: ToolCallRecord;
  agent: AgentId;
}) {
  const isErr = call.status === 'error';
  const isOpt = agent === 'optimist';
  const borderColor = isErr
    ? 'border-red-500/40'
    : isOpt
      ? 'border-optimist-500/25'
      : 'border-skeptic-500/25';
  const dotColor = isErr
    ? 'bg-red-400'
    : call.status === 'running'
      ? 'bg-amber-400'
      : 'bg-emerald-400';

  const preview = formatToolArgs(call);

  return (
    <li className={`rounded-md border ${borderColor} bg-white/[0.015] px-2.5 py-1.5`}>
      <div className="flex items-center gap-2 text-[11px]">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
        <span className="font-mono text-[11px] font-semibold text-slate-100">
          {TOOL_LABEL[call.tool] ?? call.tool}
        </span>
        {call.finishedAt && call.startedAt && (
          <span className="ml-auto font-mono text-[9.5px] text-slate-500">
            {Math.max(1, Math.round((call.finishedAt - call.startedAt) / 100) / 10)}s
          </span>
        )}
      </div>
      {preview && (
        <p className="mt-1 line-clamp-4 break-words text-[10.5px] leading-snug text-slate-400">
          {preview}
        </p>
      )}
      {isErr && call.error && (
        <p className="mt-1 line-clamp-2 text-[10.5px] text-red-300/80">
          ⚠ {call.error}
        </p>
      )}
    </li>
  );
}

function formatToolArgs(call: ToolCallRecord): string | null {
  const a = call.args ?? {};
  if (typeof a.query === 'string') return a.query;
  if (typeof a.claim === 'string')
    return `claim: ${a.claim}${typeof a.sourceUrl === 'string' ? ` · ${a.sourceUrl}` : ''}`;
  if (typeof a.title === 'string')
    return `${a.title}${typeof a.type === 'string' ? ` (${a.type})` : ''}`;
  if (typeof a.code === 'string') return a.code.replace(/\s+/g, ' ').slice(0, 240);
  try {
    const s = JSON.stringify(a);
    return s.length > 240 ? s.slice(0, 240) + '…' : s;
  } catch {
    return null;
  }
}
