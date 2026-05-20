/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        editorial: ['"Playfair Display"', 'Georgia', 'serif'],
        hand: ['"Patrick Hand"', 'cursive'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        paper: '#f5f1e8',
        ink: '#1b1a17',
        teal: {
          500: '#0e8a7a',
        },
        royal: {
          500: '#6c2bd9',
        },
        accent: {
          500: '#c1361d',
        },
        muted: '#9b8c7a',
        // Alias compatibili per Recharts/ErrorBoundary che usano vecchi nomi.
        optimist: { 500: '#0e8a7a', 400: '#0e8a7a' },
        skeptic: { 500: '#6c2bd9', 400: '#6c2bd9' },
      },
    },
  },
  plugins: [],
};
