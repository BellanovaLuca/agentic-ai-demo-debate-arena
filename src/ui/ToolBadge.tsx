import { motion } from 'framer-motion';

import type { ToolCallRecord } from '../types';
import { TOOL_ICON, TOOL_LABEL } from './icons';

interface Props {
  call: ToolCallRecord;
  compact?: boolean;
}

export function ToolBadge({ call, compact = false }: Props) {
  const Icon = TOOL_ICON[call.tool];
  const isRunning = call.status === 'running';
  const isError = call.status === 'error';
  const label = TOOL_LABEL[call.tool];
  const query =
    typeof call.args.query === 'string'
      ? (call.args.query as string).slice(0, 80)
      : null;
  const title =
    typeof call.args.title === 'string'
      ? (call.args.title as string).slice(0, 60)
      : null;

  const color = isError
    ? 'border-red-500/40 bg-red-500/10 text-red-300'
    : isRunning
      ? 'border-optimist-500/40 bg-optimist-500/10 text-optimist-400'
      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`chip ${color}`}
    >
      <motion.span
        aria-hidden="true"
        animate={isRunning ? { scale: [1, 1.25, 1], opacity: [1, 0.6, 1] } : {}}
        transition={isRunning ? { duration: 1.2, repeat: Infinity } : {}}
        className="flex items-center"
      >
        <Icon className="h-3.5 w-3.5" />
      </motion.span>
      <span className="font-mono">{label}</span>
      {!compact && (query ?? title) && (
        <span className="max-w-[180px] truncate text-[10px] opacity-70">
          {query ?? title}
        </span>
      )}
    </motion.div>
  );
}
