/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Times New Roman', 'serif'],
        sans: [
          'Inter Tight',
          'Inter',
          'Segoe UI',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      colors: {
        optimist: {
          50: '#f0f9ff',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        skeptic: {
          50: '#fdf4ff',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
        judge: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        arena: {
          bg: '#0b0f1a',
          panel: '#111827',
          border: '#1f2937',
        },
      },
      animation: {
        'pulse-tool': 'pulse 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
