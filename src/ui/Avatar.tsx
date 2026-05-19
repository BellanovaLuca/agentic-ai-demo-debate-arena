import { motion, useReducedMotion } from 'framer-motion';

import type { AgentId } from '../types';
import { AGENTS } from '../types';

// Stati emotivi: idle | thinking | speaking | toolRunning | confident
export type AvatarMood =
  | 'idle'
  | 'thinking'
  | 'speaking'
  | 'toolRunning'
  | 'confident';

interface Props {
  agent: AgentId;
  mood: AvatarMood;
  size?: number;
  // Mostra l'etichetta del mood sotto il cerchio. Default true.
  showMoodLabel?: boolean;
}

// Mappa esportata cosi i consumer possono renderizzare l'etichetta dove
// preferiscono (es. sotto al nome invece che sotto al cerchio).
export const AVATAR_MOOD_LABEL: Record<AvatarMood, string> = {
  idle: 'in attesa',
  thinking: 'sta pensando',
  speaking: 'sta parlando',
  toolRunning: 'sta usando un tool',
  confident: 'pronto al colpo',
};

// Avatar minimal: cerchio gradiente con emoji.
// Animazione varia per mood.
export function Avatar({ agent, mood, size = 80, showMoodLabel = true }: Props) {
  const profile = AGENTS[agent];
  const prefersReducedMotion = useReducedMotion();
  const ring =
    agent === 'optimist'
      ? 'ring-optimist-500/60 bg-gradient-to-br from-optimist-400/40 to-optimist-700/40'
      : 'ring-skeptic-500/60 bg-gradient-to-br from-skeptic-400/40 to-skeptic-700/40';

  const animation = prefersReducedMotion
    ? { scale: 1 }
    : mood === 'thinking'
      ? { scale: [1, 1.04, 1], rotate: [0, -2, 2, 0] }
      : mood === 'speaking'
        ? { scale: [1, 1.08, 1] }
        : mood === 'toolRunning'
          ? { y: [0, -3, 0] }
          : mood === 'confident'
            ? { scale: [1, 1.1, 1] }
            : { scale: 1 };

  const transition =
    mood === 'idle'
      ? { duration: 0.4 }
      : mood === 'speaking'
        ? { duration: 0.5, repeat: Infinity }
        : mood === 'thinking'
          ? { duration: 1.6, repeat: Infinity }
          : mood === 'toolRunning'
            ? { duration: 1, repeat: Infinity }
            : { duration: 0.8 };

  return (
    <div className="flex flex-col items-center gap-2.5">
      <motion.div
        className={`flex items-center justify-center rounded-full ring-4 ${ring}`}
        style={{ width: size, height: size }}
        animate={animation}
        transition={transition}
      >
        <span aria-hidden="true" style={{ fontSize: size * 0.5 }}>{profile.emoji}</span>
      </motion.div>
      {showMoodLabel && (
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {AVATAR_MOOD_LABEL[mood]}
        </div>
      )}
    </div>
  );
}
