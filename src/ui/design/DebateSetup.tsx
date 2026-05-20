import { useState } from 'react';

import { runDebate } from '../../debate-loop/runDebate';
import { APP_ENV } from '../../lib/env';
import { roundsToTotalTurns } from '../../debate-loop/schedule';
import { useDebateStore } from '../../store/debateStore';
import {
  ACCENT,
  AvatarOpt,
  AvatarSkp,
  INK,
  Note,
  PAPER,
  ROYAL,
  TEAL,
} from './primitives';
import { SettingsPill } from './SettingsPill';

const PRESETS = [
  'Le AI generative aumenteranno la produttività globale del 30% entro il 2030',
  'La settimana lavorativa di 4 giorni dovrebbe diventare lo standard',
  "L'energia nucleare è la soluzione migliore per la transizione ecologica",
  'I social network fanno più male che bene alla società',
  'Il telelavoro è più produttivo del lavoro in ufficio',
  'Bitcoin sarà la valuta dominante entro il 2040',
];

export function DebateSetup({ onInfo }: { onInfo: () => void }) {
  const speed = useDebateStore((s) => s.speed);
  const confrontoRounds = useDebateStore((s) => s.confrontoRounds);
  const totalTurns = roundsToTotalTurns(confrontoRounds);

  const [topic, setTopic] = useState(PRESETS[0] ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const start = async () => {
    setError(null);
    if (!APP_ENV.geminiApiKey) {
      setError(
        'VITE_GEMINI_API_KEY mancante. Copia .env.example in .env e inserisci la chiave Gemini.',
      );
      return;
    }
    const trimmed = topic.trim();
    if (trimmed.length < 8) {
      setError('Inserisci un tema di almeno 8 caratteri.');
      return;
    }
    setSubmitting(true);
    try {
      await runDebate({ topic: trimmed });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: PAPER,
        color: INK,
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        padding: '24px 36px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* masthead */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderBottom: `1.8px solid ${INK}`,
          paddingBottom: 10,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: -0.5,
            }}
          >
            Debate&nbsp;Arena
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SettingsPill mode="setup" />
          <button
            type="button"
            onClick={onInfo}
            title="Come funziona Debate Arena"
            aria-label="Come funziona Debate Arena"
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
            ? come funziona
          </button>
        </div>
      </div>

      {/* hero face-off */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 24,
          alignItems: 'center',
          padding: '30px 0 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <AvatarOpt size={60} ring={TEAL} />
          <div>
            <Note color={TEAL}>red corner · ottimista</Note>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 22,
                lineHeight: 1,
                marginTop: 3,
              }}
            >
              L'Ottimista Tech
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: 13,
                marginTop: 4,
                lineHeight: 1.3,
                color: '#5a4e42',
                maxWidth: 280,
              }}
            >
              "Difenderà il tema con dati, analogie storiche e visione di lungo termine."
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: 48,
              color: ACCENT,
              lineHeight: 1,
            }}
          >
            vs
          </div>
          <Note style={{ marginTop: 6 }}>4 fasi · 4 assi · 1 verdetto</Note>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexDirection: 'row-reverse',
            textAlign: 'right',
          }}
        >
          <AvatarSkp size={60} ring={ROYAL} />
          <div>
            <Note color={ROYAL}>blue corner · scettico</Note>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 22,
                lineHeight: 1,
                marginTop: 3,
              }}
            >
              Lo Scettico Critico
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: 13,
                marginTop: 4,
                lineHeight: 1.3,
                color: '#5a4e42',
                maxWidth: 280,
                marginLeft: 'auto',
              }}
            >
              "Attaccherà la tesi con contro-evidenza, costi nascosti e fallacie logiche."
            </div>
          </div>
        </div>
      </div>

      {/* topic input */}
      <div
        style={{
          borderTop: `1.5px solid ${INK}`,
          paddingTop: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Note color={ACCENT}>tema del dibattito</Note>
          <Note>{topic.length} / 500</Note>
        </div>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={500}
          placeholder="Scrivi una tesi controversa, o scegli un preset qui sotto…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void start();
            }
          }}
          style={{
            width: '100%',
            minHeight: 88,
            resize: 'vertical',
            padding: '14px 16px',
            border: `1.8px solid ${INK}`,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.5)',
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: 20,
            lineHeight: 1.3,
            color: INK,
            outline: 'none',
          }}
        />
      </div>

      {/* presets */}
      <div style={{ paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Note color={ACCENT}>preset · clicca per usare</Note>
          <div style={{ flex: 1, height: 1, background: INK, opacity: 0.2 }} />
          <button
            onClick={() => setTopic(PRESETS[Math.floor(Math.random() * PRESETS.length)] ?? PRESETS[0]!)}
            style={{
              background: 'transparent',
              border: `1.5px dashed ${INK}`,
              borderRadius: 999,
              padding: '4px 12px',
              fontFamily: "'Patrick Hand', cursive",
              fontSize: 13,
              cursor: 'pointer',
              color: INK,
            }}
          >
            🎲 esempio random
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 8,
          }}
        >
          {PRESETS.map((p, i) => {
            const active = p === topic;
            return (
              <button
                key={i}
                onClick={() => setTopic(p)}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '10px 14px',
                  background: active ? `${ACCENT}10` : 'rgba(255,255,255,0.4)',
                  border: active ? `1.8px solid ${ACCENT}` : `1.5px solid ${INK}30`,
                  borderRadius: 10,
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  fontSize: 14,
                  lineHeight: 1.3,
                  color: INK,
                  transition: 'border .12s, background .12s',
                }}
              >
                <Note color={active ? ACCENT : '#9b8c7a'} style={{ marginBottom: 3 }}>
                  · {String(i + 1).padStart(2, '0')} ·
                </Note>
                "{p}"
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 14,
            padding: '10px 14px',
            border: `1.5px solid ${ACCENT}`,
            background: `${ACCENT}10`,
            borderRadius: 8,
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            color: ACCENT,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* footer · start */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 24,
          borderTop: `1.8px solid ${INK}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Note>pronto a iniziare</Note>
          <div style={{ fontFamily: "'Patrick Hand', cursive", fontSize: 18, marginTop: 2 }}>
            {totalTurns} turni · velocità {speed}x · {topic.trim() ? '✓ tema impostato' : '⚠ tema mancante'}
          </div>
        </div>
        <button
          onClick={() => void start()}
          disabled={!topic.trim() || submitting}
          style={{
            background: topic.trim() && !submitting ? ACCENT : '#bdb3a3',
            color: '#fff',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 10,
            fontFamily: "'Patrick Hand', cursive",
            fontSize: 20,
            fontWeight: 700,
            cursor: topic.trim() && !submitting ? 'pointer' : 'not-allowed',
            boxShadow: topic.trim() && !submitting ? `3px 3px 0 ${INK}` : 'none',
            letterSpacing: 0.5,
          }}
        >
          ▶ inizia dibattito
        </button>
      </div>
    </div>
  );
}
