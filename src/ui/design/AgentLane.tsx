import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  selectAgentCharts,
  selectOwnCitations,
  useDebateStore,
} from '../../store/debateStore';
import type { AgentId, ChartSpec, Phase, Turn } from '../../types';
import { ChartCard } from '../ChartCard';
import { CitesList } from './CitesList';
import {
  AvatarOpt,
  AvatarSkp,
  INK,
  MUTED,
  Note,
  PAPER,
  ROYAL,
  TEAL,
  Tab,
} from './primitives';
import { ToolsList } from './ToolsList';

type TabKey = 'msg' | 'tools' | 'cites';

const PHASE_INDEX: Record<Phase, number> = {
  apertura: 1,
  ricerca: 2,
  confronto: 3,
  chiusura: 4,
};

const PHASE_LABEL: Record<Phase, string> = {
  apertura: 'apertura',
  ricerca: 'ricerca',
  confronto: 'confronto',
  chiusura: 'chiusura',
};

function romanize(n: number): string {
  return ['i', 'ii', 'iii', 'iv'][n - 1] ?? String(n);
}

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function AgentLane({ agent }: { agent: AgentId }) {
  const isOpt = agent === 'optimist';
  const color = isOpt ? TEAL : ROYAL;

  const allTurns = useDebateStore(useShallow((s) => s.turns));
  const liveThinking = useDebateStore((s) => s.liveThinking[agent]);
  const liveSpeech = useDebateStore((s) => s.liveSpeech[agent]);
  const activeTool = useDebateStore((s) => s.activeToolCall[agent]);
  const currentStepIndex = useDebateStore((s) => s.currentStepIndex);
  const activeSchedule = useDebateStore(useShallow((s) => s.activeSchedule));
  const citations = useDebateStore(useShallow((s) => selectOwnCitations(s, agent)));
  const charts = useDebateStore(useShallow((s) => selectAgentCharts(s, agent)));
  const status = useDebateStore((s) => s.status);

  const agentTurns = useMemo(() => allTurns.filter((t) => t.agent === agent), [allTurns, agent]);
  const allTools = useMemo(
    () => agentTurns.flatMap((t) => t.toolCalls),
    [agentTurns],
  );

  // Grafici "orfani": creati nello store ma non attribuiti a un turno
  // (es. il fallback di fine dibattito).
  const orphanCharts = useMemo<ChartSpec[]>(() => {
    const attributed = new Set<string>();
    for (const t of agentTurns) for (const id of t.chartsCreated) attributed.add(id);
    return charts.filter((c) => !attributed.has(c.id));
  }, [agentTurns, charts]);

  // Stato della tab attiva. Se l'utente non l'ha mai cambiata, default = msg.
  const [tab, setTab] = useState<TabKey>('msg');

  // Determina se questo agente sta attualmente parlando.
  const currentStep = activeSchedule[currentStepIndex];
  const isCurrentSpeaker =
    (status === 'running' || status === 'configuring') && currentStep?.agent === agent;
  const isThinking = isCurrentSpeaker && !!liveThinking && !liveSpeech;
  const isSpeaking = isCurrentSpeaker && !!liveSpeech;
  const isToolRunning = isCurrentSpeaker && !!activeTool;

  // Auto-scroll quando arriva un nuovo messaggio.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [agentTurns.length, liveSpeech, tab]);

  const moodLabel = isToolRunning
    ? '● usa uno strumento…'
    : isSpeaking
      ? '● sta scrivendo…'
      : isThinking
        ? '● sta pensando…'
        : status === 'completed'
          ? 'concluso'
          : agentTurns.length > 0
            ? 'in ascolto'
            : 'in attesa';

  const tabsOrder = isOpt
    ? (['msg', 'tools', 'cites'] as const)
    : (['cites', 'tools', 'msg'] as const);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden', minWidth: 0 }}>
      {/* head: avatar + nome + stato + tabs sulla stessa riga.
          Due gruppi: identita (avatar+nome) e tabs, separati con space-between.
          Per lo scettico flexDirection=row-reverse mette l'identita a destra e i tab a sinistra. */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexDirection: isOpt ? 'row' : 'row-reverse',
          textAlign: isOpt ? 'left' : 'right',
          borderBottom: `1px solid ${INK}22`,
          paddingBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexDirection: isOpt ? 'row' : 'row-reverse',
            minWidth: 0,
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {isOpt ? <AvatarOpt size={44} ring={TEAL} /> : <AvatarSkp size={44} ring={ROYAL} />}
            <div
              style={{
                position: 'absolute',
                [isOpt ? 'right' : 'left']: -1,
                bottom: -1,
                width: 11,
                height: 11,
                borderRadius: '50%',
                background: isCurrentSpeaker ? color : '#fff',
                border: `2px solid ${isCurrentSpeaker ? PAPER : color}`,
              } as React.CSSProperties}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 20,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isOpt ? "L'Ottimista Tech" : 'Lo Scettico Critico'}
            </div>
            <Note color={color} style={{ marginTop: 3 }}>
              {moodLabel}
            </Note>
          </div>
        </div>
        {/* tabs */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {tabsOrder.map((key) =>
            key === 'msg' ? (
              <Tab
                key="msg"
                label="messaggi"
                count={agentTurns.length}
                color={color}
                active={tab === 'msg'}
                onClick={() => setTab('msg')}
              />
            ) : key === 'tools' ? (
              <Tab
                key="tools"
                label="strumenti"
                count={allTools.length}
                color={color}
                active={tab === 'tools'}
                onClick={() => setTab('tools')}
              />
            ) : (
              <Tab
                key="cites"
                label="citazioni"
                count={citations.length}
                color={color}
                active={tab === 'cites'}
                onClick={() => setTab('cites')}
              />
            ),
          )}
        </div>
      </div>

      {/* contenuto */}
      <div ref={scrollRef} style={{ overflowY: 'auto', paddingRight: 4, flex: 1, minHeight: 0 }}>
        {tab === 'msg' && (
          <Messages
            agentTurns={agentTurns}
            chartsById={Object.fromEntries(charts.map((c) => [c.id, c]))}
            orphanCharts={orphanCharts}
            color={color}
            isOpt={isOpt}
            liveThinking={isThinking ? liveThinking : ''}
            liveSpeech={isSpeaking ? liveSpeech : ''}
            isCurrentSpeaker={isCurrentSpeaker}
            currentStep={currentStep}
            onCitePillClick={() => setTab('cites')}
            onToolPillClick={() => setTab('tools')}
            activeToolName={activeTool?.tool ?? null}
          />
        )}
        {tab === 'tools' && <ToolsList items={allTools} color={color} />}
        {tab === 'cites' && <CitesList items={citations} color={color} turns={agentTurns} />}
      </div>
    </div>
  );
}

interface MessagesProps {
  agentTurns: ReadonlyArray<Turn>;
  chartsById: Record<string, ChartSpec>;
  orphanCharts: ReadonlyArray<ChartSpec>;
  color: string;
  isOpt: boolean;
  liveThinking: string;
  liveSpeech: string;
  isCurrentSpeaker: boolean;
  currentStep: { phase: Phase; agent: AgentId } | undefined;
  onCitePillClick: () => void;
  onToolPillClick: () => void;
  activeToolName: string | null;
}

function Messages({
  agentTurns,
  chartsById,
  orphanCharts,
  color,
  isOpt,
  liveThinking,
  liveSpeech,
  isCurrentSpeaker,
  currentStep,
  onCitePillClick,
  onToolPillClick,
  activeToolName,
}: MessagesProps) {
  if (agentTurns.length === 0 && !isCurrentSpeaker) {
    return (
      <Note style={{ marginTop: 8, fontStyle: 'italic', textTransform: 'none' }}>
        in attesa del primo turno…
      </Note>
    );
  }

  // Mostra divisori di fase quando cambia.
  let lastPhase: Phase | null = null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {agentTurns.map((turn) => {
        const showPhase = turn.phase !== lastPhase;
        lastPhase = turn.phase;
        const turnCharts = turn.chartsCreated
          .map((id) => chartsById[id])
          .filter((c): c is ChartSpec => Boolean(c));
        return (
          <div key={turn.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {showPhase && <PhaseDivider phase={turn.phase} />}
            <TurnBubble
              turn={turn}
              charts={turnCharts}
              color={color}
              isOpt={isOpt}
              onCitePillClick={onCitePillClick}
              onToolPillClick={onToolPillClick}
            />
          </div>
        );
      })}

      {isCurrentSpeaker && currentStep && (
        <>
          {currentStep.phase !== lastPhase && <PhaseDivider phase={currentStep.phase} />}
          <LiveBubble
            phase={currentStep.phase}
            color={color}
            isOpt={isOpt}
            thinking={liveThinking}
            speech={liveSpeech}
            activeToolName={activeToolName}
          />
        </>
      )}

      {orphanCharts.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Note color={color}>sintesi finale · grafico riepilogo</Note>
          {orphanCharts.map((c) => (
            <ChartCard key={c.id} chart={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function PhaseDivider({ phase }: { phase: Phase }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
      <div style={{ flex: 1, height: 1, background: INK, opacity: 0.25 }} />
      <Note>
        {romanize(PHASE_INDEX[phase])} · {PHASE_LABEL[phase]}
      </Note>
      <div style={{ flex: 1, height: 1, background: INK, opacity: 0.25 }} />
    </div>
  );
}

function TurnBubble({
  turn,
  charts,
  color,
  isOpt,
  onCitePillClick,
  onToolPillClick,
}: {
  turn: Turn;
  charts: ReadonlyArray<ChartSpec>;
  color: string;
  isOpt: boolean;
  onCitePillClick: () => void;
  onToolPillClick: () => void;
}) {
  const turnLabel = `T${turn.index + 1}${turn.toolCalls.length > 0 ? ` · 🔧 ${turn.toolCalls.length}` : ''}`;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        {isOpt ? (
          <>
            <Note color={color}>{turnLabel}</Note>
            <Note>{formatTime(turn.createdAt)}</Note>
          </>
        ) : (
          <>
            <Note>{formatTime(turn.createdAt)}</Note>
            <Note color={color}>{turn.attacksOpponent ? `${turnLabel} · ↯ attacco` : turnLabel}</Note>
          </>
        )}
      </div>
      <div
        style={{
          padding: '10px 14px',
          border: `1.5px solid ${color}`,
          [isOpt ? 'borderTopLeftRadius' : 'borderTopRightRadius']: 4,
          borderRadius: 14,
          background: isOpt ? 'rgba(14,138,122,0.05)' : 'rgba(108,43,217,0.05)',
        } as React.CSSProperties}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: 14,
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
          }}
        >
          {turn.speech ? `"${turn.speech}"` : <span style={{ color: MUTED }}>(turno senza testo)</span>}
        </div>
        {turn.attacksOpponent && (
          <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px dashed ${color}` }}>
            <Note color={color} style={{ textTransform: 'none', fontStyle: 'italic' }}>
              ⚔ "{turn.attacksOpponent}"
            </Note>
          </div>
        )}
        {(turn.toolCalls.length > 0 || turn.citationsCollected.length > 0) && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {turn.toolCalls.map((tc) => (
              <button
                key={tc.id}
                onClick={onToolPillClick}
                style={{
                  background: 'transparent',
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                }}
                title="Apri tab strumenti"
              >
                <PillSmall color={color}>🔧 {tc.tool.replace('_', '.')}</PillSmall>
              </button>
            ))}
            {turn.citationsCollected.slice(0, 4).map((cid) => (
              <button
                key={cid}
                onClick={onCitePillClick}
                style={{
                  background: 'transparent',
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                }}
                title="Apri tab citazioni"
              >
                <PillSmall color={color}>📎 fonte</PillSmall>
              </button>
            ))}
          </div>
        )}
        {charts.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {charts.map((c) => (
              <ChartCard key={c.id} chart={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveBubble({
  phase: _phase,
  color,
  isOpt,
  thinking,
  speech,
  activeToolName,
}: {
  phase: Phase;
  color: string;
  isOpt: boolean;
  thinking: string;
  speech: string;
  activeToolName: string | null;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        {isOpt ? (
          <>
            <Note color={color}>● live</Note>
            <Note>—</Note>
          </>
        ) : (
          <>
            <Note>—</Note>
            <Note color={color}>● live</Note>
          </>
        )}
      </div>
      <div
        style={{
          padding: '10px 14px',
          border: `1.5px dashed ${color}`,
          [isOpt ? 'borderTopLeftRadius' : 'borderTopRightRadius']: 4,
          borderRadius: 14,
          background: isOpt ? 'rgba(14,138,122,0.04)' : 'rgba(108,43,217,0.04)',
        } as React.CSSProperties}
      >
        {speech ? (
          <div
            className="streaming-caret"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: 14,
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
            }}
          >
            "{speech}"
          </div>
        ) : thinking ? (
          <div
            className="streaming-caret"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              lineHeight: 1.5,
              color: '#3a352c',
            }}
          >
            <span style={{ color, fontWeight: 700 }}>pensiero · </span>
            {thinking.length > 280 ? `…${thinking.slice(-280)}` : thinking}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="animate-pulse-soft" style={{ width: 6, height: 6, borderRadius: '50%', background: color, opacity: 0.5 }} />
            <span className="animate-pulse-soft" style={{ width: 6, height: 6, borderRadius: '50%', background: color, opacity: 0.7 }} />
            <span className="animate-pulse-soft" style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
            <Note color={color} style={{ marginLeft: 8 }}>
              {activeToolName ? `🔧 ${activeToolName.replace('_', '.')}` : 'in pensiero…'}
            </Note>
          </div>
        )}
      </div>
    </div>
  );
}

function PillSmall({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 9px',
        border: `1.5px solid ${color}`,
        borderRadius: 999,
        fontFamily: "'Patrick Hand', cursive",
        fontSize: 12,
        color,
        background: 'transparent',
      }}
    >
      {children}
    </span>
  );
}
