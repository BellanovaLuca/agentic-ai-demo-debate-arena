// Estrattore parziale di campi stringa da JSON in arrivo via streaming.
// Usato per mostrare "thinking" e "speech" che si formano in tempo reale.
// Non e' un vero parser JSON: e' una regex tollerante che funziona finche
// il campo desiderato e' una stringa terminata da `"` (con escape standard).

const UNESCAPE_MAP: Record<string, string> = {
  n: '\n',
  r: '\r',
  t: '\t',
  '"': '"',
  '\\': '\\',
  '/': '/',
};

function unescapeJsonish(s: string): string {
  return s.replace(/\\(["\\/nrt])/g, (_, ch: string) => UNESCAPE_MAP[ch] ?? ch);
}

export function extractPartialField(
  accumulator: string,
  field: 'thinking' | 'speech' | 'attacks_opponent',
): string | null {
  const re = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`);
  const m = re.exec(accumulator);
  if (!m || !m[1]) return null;
  return unescapeJsonish(m[1]);
}
