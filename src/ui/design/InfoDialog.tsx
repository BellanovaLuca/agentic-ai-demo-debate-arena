import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { ACCENT, INK, Note, PAPER } from './primitives';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InfoDialog({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (typeof document === 'undefined' || !open) return null;

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(27,26,23,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: PAPER,
          border: `1.8px solid ${INK}`,
          borderRadius: 12,
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '20px 24px',
          boxShadow: '6px 6px 0 rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderBottom: `1.5px solid ${INK}`,
            paddingBottom: 10,
            marginBottom: 14,
          }}
        >
          <div>
            <Note color={ACCENT}>come funziona</Note>
            <h2
              id="info-title"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 26,
                margin: '4px 0 0',
              }}
            >
              Debate Arena
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1.5px solid ${INK}`,
              borderRadius: 999,
              padding: '4px 12px',
              fontFamily: "'Patrick Hand', cursive",
              fontSize: 13,
              cursor: 'pointer',
              color: INK,
            }}
          >
            chiudi ×
          </button>
        </div>

        <Section title="che cos'è">
          Due agenti AI con personalità opposte — <strong>L'Ottimista Tech</strong> e{' '}
          <strong>Lo Scettico Critico</strong> — dibattono su un tema scelto da te. Un{' '}
          <strong style={{ color: ACCENT }}>giudice</strong> imparziale valuta ogni turno su 4 assi
          (logica, fonti, dati, replica) ed emette un verdetto finale motivato.
        </Section>

        <Section title="le quattro fasi">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <li>
              <strong>Apertura</strong> — 2 turni · nessun tool. Ogni agente espone la propria posizione.
            </li>
            <li>
              <strong>Ricerca</strong> — 2 turni · <code>web.search</code>. Si raccolgono evidenze.
            </li>
            <li>
              <strong>Confronto</strong> — 2 / 4 / 6 / 8 turni · tutti i tool. Attacchi, calcoli, grafici, fact-check.
            </li>
            <li>
              <strong>Chiusura</strong> — 2 turni · nessun tool. Sintesi finale.
            </li>
          </ol>
          <p style={{ marginTop: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
            turni totali = 6 + 2 × round di confronto.
          </p>
        </Section>

        <Section title="i tool a disposizione">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
            <li>
              <code>web_search</code> — Google grounding, raccoglie 3-5 fonti per turno.
            </li>
            <li>
              <code>execute_code</code> — JavaScript in sandbox (timeout 3s) per calcoli numerici.
            </li>
            <li>
              <code>create_chart</code> — genera grafici Recharts (linea, barre, torta).
            </li>
            <li>
              <code>fact_check</code> — valuta una citazione rispetto a un claim.
            </li>
          </ul>
        </Section>

        <Section title="controlli rapidi">
          Il pill rosso in alto a destra contiene <strong>turni totali</strong> e <strong>velocità</strong>.
          La velocità (0.25× → 4×) scala le pause tra un turno e l'altro. In live puoi mettere in{' '}
          <strong>pausa</strong>, fare <strong>stop</strong> o esportare il <strong>JSON</strong> della trascrizione.
        </Section>

        <Section title="la pagella del giudice">
          La fascia in basso mostra il punteggio cumulativo dei due agenti. Cliccala per aprire la{' '}
          <strong>pagella completa</strong>: barre per asse, contributo turno-per-turno espandibile, commento
          del giudice e verdetto.
        </Section>
      </div>
    </div>,
    document.body,
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 16 }}>
      <Note color={ACCENT} style={{ marginBottom: 6 }}>
        · {title}
      </Note>
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: 14,
          lineHeight: 1.55,
          color: '#3a352c',
        }}
      >
        {children}
      </div>
    </section>
  );
}
