import type { Citation, Turn } from '../../types';
import { Note } from './primitives';

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.slice(0, 30);
  }
}

// Trova il primo turno (in ordine cronologico) in cui questa citazione e' stata raccolta.
// Se non viene trovata in nessun turno, ritorna null.
function findUsedIn(citationId: string, turns: ReadonlyArray<Turn>): string | null {
  for (const t of turns) {
    if (t.citationsCollected.includes(citationId)) return `T${t.index + 1}`;
  }
  return null;
}

export function CitesList({
  items,
  color,
  turns,
}: {
  items: ReadonlyArray<Citation>;
  color: string;
  turns: ReadonlyArray<Turn>;
}) {
  if (items.length === 0) {
    return (
      <Note style={{ marginTop: 8, fontStyle: 'italic', textTransform: 'none' }}>
        nessuna citazione raccolta finora.
      </Note>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Note>citazioni · {items.length} fonti · clicca per aprire</Note>
      {items.map((c) => {
        const usedIn = findUsedIn(c.id, turns);
        return (
          <a
            key={c.id}
            href={c.url}
            target="_blank"
            rel="noreferrer noopener"
            title={c.url}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: 10,
              alignItems: 'baseline',
              padding: '6px 10px',
              border: `1px solid ${color}40`,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.4)',
              textDecoration: 'none',
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color }}>
              {usedIn ?? '—'}
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  fontSize: 13,
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.title}
              </div>
              <Note style={{ marginTop: 1, textTransform: 'none' }}>{hostFromUrl(c.url)}</Note>
            </div>
            <span style={{ color, fontSize: 13 }}>↗</span>
          </a>
        );
      })}
    </div>
  );
}
