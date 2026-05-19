import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ChartSpec } from '../types';

const PIE_COLORS = [
  '#0ea5e9',
  '#a855f7',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#ec4899',
  '#22d3ee',
  '#84cc16',
];

interface Props {
  chart: ChartSpec;
}

export function ChartCard({ chart }: Props) {
  const stroke = chart.agent === 'optimist' ? '#0ea5e9' : '#a855f7';
  const fill = chart.agent === 'optimist' ? '#0ea5e9' : '#a855f7';
  const labelAccent =
    chart.agent === 'optimist'
      ? 'border-optimist-500/40 bg-optimist-500/10 text-optimist-400'
      : 'border-skeptic-500/40 bg-skeptic-500/10 text-skeptic-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="panel-soft border border-arena-border p-3"
    >
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-200">{chart.title}</h4>
        <span className={`chip ${labelAccent}`}>
          <span className="font-mono">{chart.type}</span>
        </span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'line' ? (
            <LineChart data={chart.data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey={chart.xKey} stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip
                contentStyle={{ background: '#0b0f1a', border: '1px solid #1f2937', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey={chart.yKey}
                stroke={stroke}
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive
              />
            </LineChart>
          ) : chart.type === 'bar' ? (
            <BarChart data={chart.data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey={chart.xKey} stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip
                contentStyle={{ background: '#0b0f1a', border: '1px solid #1f2937', fontSize: 12 }}
              />
              <Bar dataKey={chart.yKey} fill={fill} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <PieChart>
              <Tooltip
                contentStyle={{ background: '#0b0f1a', border: '1px solid #1f2937', fontSize: 12 }}
              />
              <Pie
                data={chart.data}
                dataKey={chart.yKey}
                nameKey={chart.xKey}
                outerRadius={70}
                label={{ fontSize: 10 }}
              >
                {chart.data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
