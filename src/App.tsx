import { useState } from 'react';

import { AgentColumn } from './ui/AgentColumn';
import { Arena } from './ui/Arena';
import { Header } from './ui/Header';
import { JudgePanel } from './ui/JudgePanel';
import { VerdictModal } from './ui/VerdictModal';

// Layout principale:
// - Pagina verticalmente scrollabile (niente lock a h-screen). Header sticky.
// - In modalita' normale: le 3 colonne hanno un min-height ampio cosi i
//   contenuti restano leggibili; il pannello giudice e' sotto, l'utente
//   scrolla per vederlo per intero.
// - In modalita' "espansa": l'arena occupa l'intero viewport e nasconde
//   colonne e giudice (toggle dal bottone "Espandi" in Arena).
export default function App() {
  const [arenaExpanded, setArenaExpanded] = useState(false);

  if (arenaExpanded) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        {/* In modalita' espansa l'header viene rimosso del tutto: tutti i
            controlli essenziali (Pausa/Stop/Comprimi) restano accessibili
            dentro la toolbar dell'Arena. */}
        <div className="flex min-h-0 flex-1 p-3">
          <Arena
            expanded
            onToggleExpand={() => setArenaExpanded(false)}
          />
        </div>
        <VerdictModal />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="shrink-0">
        <Header />
      </div>

      {/* Area principale a 3 colonne: altezza vincolata al viewport cosi
          la conversazione centrale (e i contenuti delle colonne agenti)
          scorrono INTERNAMENTE invece di allungare a oltranza la pagina.
          - min: 500px per leggibilita' su viewport corti
          - viewport-based: 100vh meno header e margini
          - max: 760px cosi su monitor enormi non si "sgrana" */}
      <div className="grid grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
        <div className="h-[clamp(500px,calc(100vh-220px),760px)]">
          <AgentColumn agent="optimist" side="left" />
        </div>
        <div className="h-[clamp(500px,calc(100vh-220px),760px)]">
          <Arena
            expanded={false}
            onToggleExpand={() => setArenaExpanded(true)}
          />
        </div>
        <div className="h-[clamp(500px,calc(100vh-220px),760px)]">
          <AgentColumn agent="skeptic" side="right" />
        </div>
      </div>

      {/* Giudice in fondo, raggiungibile via scroll. */}
      <JudgePanel />

      <VerdictModal />
    </div>
  );
}
