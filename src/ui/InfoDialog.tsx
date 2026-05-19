import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { ChartIcon, CodeIcon, SearchIcon, ShieldIcon } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
}

// Dialog di "Come funziona": spiega all'utente le fasi, i tool e il
// significato del numero di turni. Apribile dal bottone (i) nell'header.
export function InfoDialog({ open, onClose }: Props) {
  // Chiusura con tasto ESC.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Renderizziamo via portal su document.body perche' l'header ha
  // backdrop-filter (-> .panel ha backdrop-blur-sm), che crea un nuovo
  // containing block intrappolando i figli "fixed". Senza portal, il dialog
  // veniva clippato dentro l'header.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="info-dialog-title"
        >
          <motion.div
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
            className="panel max-h-[90vh] w-full max-w-2xl overflow-hidden"
          >
            <header className="flex items-center justify-between gap-3 border-b border-white/5 bg-gradient-to-r from-optimist-500/[0.06] via-transparent to-skeptic-500/[0.06] px-5 py-4">
              <div className="leading-tight">
                <h2
                  id="info-dialog-title"
                  className="font-display text-xl font-semibold tracking-tight text-white"
                >
                  Come funziona Debate Arena
                </h2>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                  due agenti · quattro tool · un giudice
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Chiudi"
                className="rounded-md border border-arena-border bg-arena-bg/50 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:bg-white/5"
              >
                ✕
              </button>
            </header>

            <div className="max-h-[calc(90vh-130px)] overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-200">
              <Section title="Che cos'è">
                <p>
                  Due agenti AI con personalità opposte —{' '}
                  <strong className="text-optimist-400">l'Ottimista Tech</strong>{' '}
                  e <strong className="text-skeptic-400">lo Scettico Critico</strong>{' '}
                  — dibattono in italiano su un tema scelto da te. Un{' '}
                  <strong className="text-judge-400">giudice</strong> imparziale
                  valuta ogni turno su 4 assi (logica, fonti, dati, replica) ed
                  emette un verdetto finale motivato.
                </p>
              </Section>

              <Section title="Le quattro fasi del dibattito">
                <p className="mb-2">
                  Il dibattito è strutturato in quattro fasi sequenziali. Solo
                  il <em>Confronto</em> si allunga al crescere del numero di
                  turni; le altre tre restano fisse a un turno per agente.
                </p>
                <PhaseTable />
                <p className="mt-2 text-[12px] text-slate-400">
                  Regola: <span className="font-mono">turni totali = 6 + 2 × round di confronto</span>.
                  I 6 turni fissi sono apertura (2) + ricerca (2) + chiusura
                  (2). Aumentando i turni totali dall'header dai agli agenti più
                  spazio per smontarsi a vicenda nel confronto.
                </p>
              </Section>

              <Section title="I tool a disposizione degli agenti">
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <ToolRow
                    Icon={SearchIcon}
                    name="web_search"
                    desc="Ricerca evidenze online via Google grounding e raccoglie 3-5 citazioni (URL + titolo)."
                  />
                  <ToolRow
                    Icon={CodeIcon}
                    name="execute_code"
                    desc="Esegue JavaScript puro in sandbox per Monte Carlo, CAGR, regressioni, sanity-check numerici."
                  />
                  <ToolRow
                    Icon={ChartIcon}
                    name="create_chart"
                    desc="Genera grafici a linee/barre/torta direttamente nella conversazione."
                  />
                  <ToolRow
                    Icon={ShieldIcon}
                    name="fact_check"
                    desc="Valuta la solidità di una fonte rispetto a un claim, con punteggio 0-10."
                  />
                </ul>
                <p className="mt-2 text-[12px] text-slate-400">
                  In <em>apertura</em> e <em>chiusura</em> non si usano tool: si
                  parla e basta. In <em>ricerca</em> solo <code>web_search</code>.
                  Nel <em>confronto</em> tutti i tool sono disponibili e ne
                  servono almeno 2 diversi per turno.
                </p>
              </Section>

              <Section title="Controlli rapidi">
                <ul className="space-y-1.5 text-[13px]">
                  <li>
                    <strong className="text-slate-100">Turni</strong>: numero
                    totale di turni (sempre pari) selezionabile fra 8, 10, 12, 14.
                  </li>
                  <li>
                    <strong className="text-slate-100">Speed</strong>: scala
                    le pause tra turni. 0.25× = molto lento (~10s tra turni),
                    4× = rapido.
                  </li>
                  <li>
                    <strong className="text-slate-100">Pausa / Stop</strong>:
                    metti in pausa o interrompi il dibattito in corso.
                  </li>
                  <li>
                    <strong className="text-slate-100">Espandi</strong>{' '}
                    (Arena): nasconde colonne laterali e giudice; la chat
                    occupa tutto lo schermo.
                  </li>
                  <li>
                    <strong className="text-slate-100">Export</strong>: scarica
                    un JSON con la trascrizione completa.
                  </li>
                </ul>
              </Section>

              <Section title="Le colonne degli agenti">
                <p>
                  Ogni colonna laterale ha tre tab:{' '}
                  <strong className="text-slate-100">Pensiero</strong>{' '}
                  (ragionamento interno in streaming),{' '}
                  <strong className="text-slate-100">Strumenti</strong>{' '}
                  (cronologia di tutti i tool richiamati turno per turno),{' '}
                  <strong className="text-slate-100">Citazioni</strong>{' '}
                  (fonti raccolte via <code>web_search</code>). La riga "In
                  esecuzione" sopra le tab mostra il tool attualmente in corso.
                </p>
              </Section>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-white/5 bg-arena-bg/30 px-5 py-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-primary"
                autoFocus
              >
                Ho capito
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function PhaseTable() {
  const rows: Array<{ phase: string; turns: string; tools: string; goal: string; accent: string }> = [
    {
      phase: 'Apertura',
      turns: '2 (fissa)',
      tools: '—',
      goal: 'Ogni agente espone la sua posizione iniziale in 3-5 frasi.',
      accent: 'text-sky-300',
    },
    {
      phase: 'Ricerca',
      turns: '2 (fissa)',
      tools: 'web_search',
      goal: 'Ogni agente cerca evidenze online per supportare la sua tesi.',
      accent: 'text-emerald-300',
    },
    {
      phase: 'Confronto',
      turns: '2 · 4 · 6 · 8 (variabile)',
      tools: 'tutti',
      goal: 'Attacchi mirati, calcoli, grafici e fact-check sull\'avversario.',
      accent: 'text-amber-300',
    },
    {
      phase: 'Chiusura',
      turns: '2 (fissa)',
      tools: '—',
      goal: 'Sintesi finale: punti più forti e appello al giudice.',
      accent: 'text-rose-300',
    },
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-arena-border">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-white/[0.03] text-left text-[10px] uppercase tracking-[0.16em] text-slate-500">
            <th className="px-3 py-2 font-semibold">Fase</th>
            <th className="px-3 py-2 font-semibold">Turni</th>
            <th className="px-3 py-2 font-semibold">Tool</th>
            <th className="px-3 py-2 font-semibold">Obiettivo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.phase} className="border-t border-arena-border">
              <td className={`px-3 py-2 font-semibold ${r.accent}`}>{r.phase}</td>
              <td className="px-3 py-2 font-mono text-slate-300">{r.turns}</td>
              <td className="px-3 py-2 font-mono text-slate-300">{r.tools}</td>
              <td className="px-3 py-2 text-slate-300">{r.goal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ToolRow({
  Icon,
  name,
  desc,
}: {
  Icon: (p: { className?: string }) => JSX.Element;
  name: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-2 rounded-md border border-arena-border bg-white/[0.02] px-3 py-2">
      <span className="mt-0.5 rounded bg-arena-bg p-1.5 text-slate-300">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <div className="font-mono text-[12px] font-semibold text-slate-100">
          {name}
        </div>
        <p className="mt-0.5 text-[11.5px] leading-snug text-slate-400">
          {desc}
        </p>
      </div>
    </li>
  );
}
