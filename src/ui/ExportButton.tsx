import { useDebateStore } from '../store/debateStore';
import { DownloadIcon } from './icons';

// Export trascrizione completa come JSON. Include turni, citazioni, charts,
// score cumulativi, verdict. Niente PII (CLAUDE.md 7.1).
export function ExportButton({ className = '' }: { className?: string } = {}) {
  const status = useDebateStore((s) => s.status);
  const turns = useDebateStore((s) => s.turns);
  const config = useDebateStore((s) => s.config);

  const canExport = turns.length > 0 || status === 'completed';

  const onExport = () => {
    const state = useDebateStore.getState();
    const payload = {
      exportedAt: new Date().toISOString(),
      topic: state.config?.topic ?? '',
      positions: state.config?.positions ?? null,
      status: state.status,
      turns: state.turns,
      citations: Object.values(state.citationsById),
      charts: Object.values(state.chartsById),
      cumulativeScore: state.cumulativeScore,
      verdict: state.verdict,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug =
      (config?.topic ?? 'debate')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'debate';
    a.href = url;
    a.download = `${slug}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={onExport}
      disabled={!canExport}
      className={`btn-ghost text-xs ${className}`}
      title="Esporta trascrizione JSON"
    >
      <DownloadIcon className="h-4 w-4" />
      Export
    </button>
  );
}
