import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { useDebateStore } from '../../store/debateStore';
import { AGENTS } from '../../types';
import {
  ACCENT,
  AvatarOpt,
  AvatarSkp,
  HandUnderline,
  INK,
  Note,
  PAPER,
  ROYAL,
  TEAL,
} from './primitives';

export function VerdictModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const verdict = useDebateStore((s) => s.verdict);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!verdict || !open) return null;
  if (typeof document === 'undefined') return null;

  const winner = verdict.winner === 'tie' ? null : AGENTS[verdict.winner];
  const winnerColor =
    verdict.winner === 'optimist' ? TEAL : verdict.winner === 'skeptic' ? ROYAL : INK;

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="verdict-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(27,26,23,0.6)',
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
          maxWidth: 640,
          width: '100%',
          padding: '24px 28px',
          boxShadow: '6px 6px 0 rgba(0,0,0,0.1)',
        }}
      >
        <Note color={ACCENT} style={{ marginBottom: 8 }}>
          verdetto del giudice
        </Note>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          {verdict.winner === 'optimist' && <AvatarOpt size={56} />}
          {verdict.winner === 'skeptic' && <AvatarSkp size={56} />}
          <div>
            <h2
              id="verdict-title"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 30,
                margin: 0,
                color: winnerColor,
                lineHeight: 1.05,
              }}
            >
              {winner ? `Vince ${winner.name}` : 'Pareggio'}
            </h2>
            <HandUnderline w={220} color={ACCENT} style={{ marginTop: 2 }} />
          </div>
        </div>

        <div
          style={{
            border: `1.5px dashed ${INK}`,
            borderRadius: 8,
            padding: '12px 14px',
            background: 'rgba(255,255,255,0.4)',
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: 15,
            lineHeight: 1.5,
          }}
        >
          "{verdict.reasoning}"
        </div>

        {verdict.highlights.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <Note style={{ marginBottom: 6 }}>momenti chiave</Note>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {verdict.highlights.map((h, i) => (
                <li
                  key={i}
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: 'italic',
                    fontSize: 13,
                    lineHeight: 1.45,
                    color: '#3a352c',
                    marginBottom: 4,
                  }}
                >
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            autoFocus
            style={{
              background: ACCENT,
              color: '#fff',
              border: 'none',
              padding: '10px 22px',
              borderRadius: 8,
              fontFamily: "'Patrick Hand', cursive",
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `2px 2px 0 ${INK}`,
            }}
          >
            chiudi
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
