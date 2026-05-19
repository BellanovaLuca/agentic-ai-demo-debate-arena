import { motion } from 'framer-motion';

interface ScoreBarProps {
  label: string;
  value: number;       // valore corrente
  max: number;         // massimo possibile (cumulato)
  color: string;       // tailwind bg-color
}

export function ScoreBar({ label, value, max, color }: ScoreBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-arena-bg">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-300">
        {value}
      </div>
    </div>
  );
}
