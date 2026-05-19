import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useDebateStore } from '../store/debateStore';
import { AGENTS } from '../types';
import { TrophyIcon } from './icons';

// Modale finale che annuncia il vincitore. Dismissibile per rivedere
// la trascrizione sottostante.
export function VerdictModal() {
  const verdict = useDebateStore((s) => s.verdict);
  const [dismissed, setDismissed] = useState(false);

  const visible = verdict !== null && !dismissed;

  // Chiusura con tasto ESC.
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDismissed(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible]);

  if (!verdict) return null;
  if (typeof document === 'undefined') return null;

  const winnerLabel =
    verdict.winner === 'tie' ? null : AGENTS[verdict.winner];

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setDismissed(true)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="verdict-title"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 22 }}
            className="panel max-w-xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                aria-hidden="true"
                className="rounded-full bg-gradient-to-br from-judge-400 to-judge-600 p-2"
              >
                <TrophyIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  Verdetto del giudice
                </p>
                {winnerLabel ? (
                  <h2
                    id="verdict-title"
                    className="font-display text-2xl font-bold text-white"
                  >
                    <span aria-hidden="true">{winnerLabel.emoji}</span> Vince {winnerLabel.name}
                  </h2>
                ) : (
                  <h2
                    id="verdict-title"
                    className="font-display text-2xl font-bold text-white"
                  >
                    Pareggio
                  </h2>
                )}
              </div>
            </div>

            <p className="rounded-md border border-judge-500/30 bg-judge-500/5 p-3 text-sm leading-relaxed text-slate-200">
              {verdict.reasoning}
            </p>

            {verdict.highlights.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Momenti chiave
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {verdict.highlights.map((h, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden="true" className="text-judge-400">▸</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="btn-ghost"
                autoFocus
              >
                Chiudi
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
