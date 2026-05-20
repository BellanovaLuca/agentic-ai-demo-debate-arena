import type { ToolCallRecord, ToolName } from '../../types';
import { MUTED, Note } from './primitives';

const TOOL_LABEL: Record<ToolName, string> = {
  web_search: 'web.search',
  execute_code: 'execute.code',
  create_chart: 'create.chart',
  fact_check: 'fact.check',
};

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatInput(call: ToolCallRecord): string {
  const a = call.args ?? {};
  if (typeof a.query === 'string') return a.query;
  if (typeof a.claim === 'string') {
    const src = typeof a.sourceUrl === 'string' ? ` · ${a.sourceUrl}` : '';
    return `${a.claim}${src}`;
  }
  if (typeof a.title === 'string') {
    const type = typeof a.type === 'string' ? ` (${a.type})` : '';
    return `${a.title}${type}`;
  }
  if (typeof a.code === 'string') return a.code.replace(/\s+/g, ' ').slice(0, 200);
  try {
    const s = JSON.stringify(a);
    return s.length > 200 ? s.slice(0, 200) + '…' : s;
  } catch {
    return '';
  }
}

function formatOutput(call: ToolCallRecord): string {
  if (call.status === 'error') return `⚠ errore: ${call.error ?? 'sconosciuto'}`;
  if (call.status === 'running') return 'in esecuzione…';
  const r = call.result as unknown;
  if (r == null) return 'completato';
  if (typeof r === 'string') return r.slice(0, 200);
  if (Array.isArray(r)) return `${r.length} risultati`;
  if (typeof r === 'object') {
    const obj = r as Record<string, unknown>;
    if (typeof obj.summary === 'string') return obj.summary.slice(0, 200);
    if (Array.isArray(obj.citations)) return `${obj.citations.length} fonti raccolte`;
    if (typeof obj.confidence === 'number')
      return `confidence: ${obj.confidence.toFixed(2)}${typeof obj.verdict === 'string' ? ` · ${obj.verdict}` : ''}`;
    if (typeof obj.output === 'string') return obj.output.slice(0, 200);
    try {
      const s = JSON.stringify(r);
      return s.length > 200 ? s.slice(0, 200) + '…' : s;
    } catch {
      return 'completato';
    }
  }
  return String(r);
}

export function ToolsList({
  items,
  color,
}: {
  items: ReadonlyArray<ToolCallRecord>;
  color: string;
}) {
  if (items.length === 0) {
    return (
      <Note style={{ marginTop: 8, fontStyle: 'italic', textTransform: 'none' }}>
        nessuno strumento richiamato finora.
      </Note>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Note>strumenti usati · {items.length} chiamate</Note>
      {items.map((tool) => (
        <div
          key={tool.id}
          style={{
            border: `1.5px solid ${color}`,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.5)',
            padding: '8px 12px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11.5,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ color, fontWeight: 700 }}>🔧 {TOOL_LABEL[tool.tool] ?? tool.tool}</span>
            <span style={{ color: MUTED, fontSize: 10 }}>{formatTime(tool.startedAt)}</span>
          </div>
          <div style={{ color: '#3a352c', marginTop: 3, wordBreak: 'break-word' }}>↳ {formatInput(tool)}</div>
          <div style={{ color: '#5a4e42', marginTop: 2, fontStyle: 'italic', wordBreak: 'break-word' }}>
            {formatOutput(tool)}
          </div>
        </div>
      ))}
    </div>
  );
}
