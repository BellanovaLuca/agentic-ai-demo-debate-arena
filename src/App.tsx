import { useEffect, useState } from 'react';

import { useDebateStore } from './store/debateStore';
import { DebateLive } from './ui/design/DebateLive';
import { DebateSetup } from './ui/design/DebateSetup';
import { InfoDialog } from './ui/design/InfoDialog';
import { VerdictModal } from './ui/design/VerdictModal';

type View = 'setup' | 'live';

function downloadDebateJson(): void {
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
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug =
    (state.config?.topic ?? 'debate')
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
}

export default function App() {
  const status = useDebateStore((s) => s.status);
  const verdict = useDebateStore((s) => s.verdict);
  const requestCancel = useDebateStore((s) => s.requestCancel);
  const reset = useDebateStore((s) => s.reset);
  const [view, setView] = useState<View>('setup');
  const [infoOpen, setInfoOpen] = useState(false);
  const [verdictOpen, setVerdictOpen] = useState(false);

  // Passa automaticamente alla live quando il dibattito parte
  // (status diventa configuring/running) e ritorna a setup se l'utente fa
  // explicit reset / nuovo dibattito.
  useEffect(() => {
    if (
      status === 'configuring' ||
      status === 'running' ||
      status === 'paused' ||
      status === 'completed' ||
      status === 'cancelled' ||
      status === 'error'
    ) {
      setView('live');
    }
  }, [status]);

  // Quando arriva un nuovo verdict (oggetto identity-changed) lo apriamo
  // automaticamente. L'utente puo' poi chiuderlo e riaprirlo manualmente
  // dal bottone "⚖ verdetto" nella toolbar.
  useEffect(() => {
    if (verdict) setVerdictOpen(true);
  }, [verdict]);

  const goToSetup = () => {
    // Se un dibattito e' in corso, lo interrompiamo prima di tornare al setup
    // per evitare di lasciare il loop running in background.
    if (status === 'running' || status === 'paused' || status === 'configuring') {
      requestCancel();
    }
    reset();
    setVerdictOpen(false);
    setView('setup');
  };

  return (
    <>
      {view === 'setup' ? (
        <DebateSetup onInfo={() => setInfoOpen(true)} />
      ) : (
        <DebateLive
          onNewDebate={goToSetup}
          onInfo={() => setInfoOpen(true)}
          onExport={downloadDebateJson}
          onOpenVerdict={() => setVerdictOpen(true)}
        />
      )}
      <InfoDialog open={infoOpen} onClose={() => setInfoOpen(false)} />
      <VerdictModal open={verdictOpen} onClose={() => setVerdictOpen(false)} />
    </>
  );
}
