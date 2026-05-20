import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { AgentLane } from './AgentLane';
import { INK, Note, PAPER } from './primitives';

export function FullscreenConversation({
  open,
  onClose,
  topic,
}: {
  open: boolean;
  onClose: () => void;
  topic: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Conversazione a tutto schermo"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 55,
        background: PAPER,
        color: INK,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 36px',
      }}
    >
      {/* header del modal */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottom: `1.8px solid ${INK}`,
          paddingBottom: 10,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <Note>lettura facilitata · conversazione completa</Note>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: 22,
              lineHeight: 1.2,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            "{topic || 'in attesa…'}"
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: `1.5px solid ${INK}`,
            borderRadius: 999,
            padding: '4px 14px',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: 14,
            cursor: 'pointer',
            color: INK,
            flexShrink: 0,
          }}
          title="Chiudi (Esc)"
        >
          ⤡ chiudi
        </button>
      </div>

      {/* due colonne, altezza piena */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.5px 1fr',
          gap: 32,
          paddingTop: 12,
          flex: 1,
          minHeight: 0,
        }}
      >
        <AgentLane agent="optimist" />
        <div style={{ background: INK, opacity: 0.85 }} />
        <AgentLane agent="skeptic" />
      </div>
    </div>,
    document.body,
  );
}
