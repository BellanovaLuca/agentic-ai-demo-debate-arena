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

const TEAL = '#0e8a7a';
const ROYAL = '#6c2bd9';
const INK = '#1b1a17';
const MUTED = '#9b8c7a';
const PAPER = '#f5f1e8';

const PIE_COLORS = [TEAL, ROYAL, '#c1361d', '#1b1a17', '#9b8c7a', '#5a4e42'];

interface Props {
  chart: ChartSpec;
}

export function ChartCard({ chart }: Props) {
  const color = chart.agent === 'optimist' ? TEAL : ROYAL;

  return (
    <div
      style={{
        border: `1.5px solid ${color}`,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.6)',
        padding: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: 13,
            lineHeight: 1.2,
            color: INK,
          }}
        >
          {chart.title}
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9.5,
            color,
            border: `1px solid ${color}`,
            borderRadius: 4,
            padding: '1px 6px',
          }}
        >
          {chart.type}
        </span>
      </div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'line' ? (
            <LineChart data={chart.data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 3" stroke={INK} strokeOpacity={0.12} />
              <XAxis dataKey={chart.xKey} stroke={MUTED} fontSize={10} />
              <YAxis stroke={MUTED} fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: PAPER,
                  border: `1px solid ${INK}`,
                  fontSize: 12,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
              <Line type="monotone" dataKey={chart.yKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} />
            </LineChart>
          ) : chart.type === 'bar' ? (
            <BarChart data={chart.data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 3" stroke={INK} strokeOpacity={0.12} />
              <XAxis dataKey={chart.xKey} stroke={MUTED} fontSize={10} />
              <YAxis stroke={MUTED} fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: PAPER,
                  border: `1px solid ${INK}`,
                  fontSize: 12,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
              <Bar dataKey={chart.yKey} fill={color} radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : (
            <PieChart>
              <Tooltip
                contentStyle={{
                  background: PAPER,
                  border: `1px solid ${INK}`,
                  fontSize: 12,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
              <Pie
                data={chart.data}
                dataKey={chart.yKey}
                nameKey={chart.xKey}
                outerRadius={68}
                label={{ fontSize: 10, fill: INK }}
              >
                {chart.data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
