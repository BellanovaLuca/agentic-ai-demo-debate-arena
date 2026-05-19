import { motion, AnimatePresence } from 'framer-motion';

import type { Citation } from '../types';

interface Props {
  citations: ReadonlyArray<Citation>;
  themeKey: 'optimist' | 'skeptic';
}

export function CitationList({ citations, themeKey }: Props) {
  const accent =
    themeKey === 'optimist'
      ? 'border-optimist-500/30 hover:border-optimist-500/60'
      : 'border-skeptic-500/30 hover:border-skeptic-500/60';

  if (citations.length === 0) {
    return (
      <p className="text-[11px] italic text-slate-500">
        Nessuna citazione raccolta.
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      <AnimatePresence initial={false}>
        {citations.map((c, i) => (
          <motion.li
            key={c.id}
            layout
            initial={{ opacity: 0, x: themeKey === 'optimist' ? -8 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`panel-soft border ${accent} px-2 py-1.5 text-[11px] transition-colors`}
          >
            <a
              href={c.url}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-start gap-1.5 text-slate-200 hover:text-white"
              title={c.url}
            >
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-arena-bg text-[9px] font-bold text-slate-400">
                {i + 1}
              </span>
              <span className="line-clamp-2 leading-snug">{c.title}</span>
            </a>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
