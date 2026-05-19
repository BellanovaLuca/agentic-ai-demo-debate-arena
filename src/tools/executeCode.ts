import { createLogger } from '../lib/logger';
import type { ExecuteCodeResult } from './types';

const log = createLogger('tool:execute_code');

const EXEC_TIMEOUT_MS = 3_000;
const MAX_CODE_LEN = 4_000;
const MAX_OUTPUT_LEN = 2_000;

// Sandbox per JS via iframe con sandbox="allow-scripts" (no allow-same-origin).
// Il codice agente NON ha accesso a window.parent, fetch, DOM del parent,
// localStorage. Comunica solo via postMessage. Il timeout chiude l'iframe
// se il codice loopa.
//
// Limiti noti accettati per la demo:
// - Niente Promise async risolte dopo il timeout (verranno scartate)
// - Niente import/require: solo built-in JS
export function runExecuteCode(args: { code?: unknown }): Promise<ExecuteCodeResult> {
  const code =
    typeof args.code === 'string' ? args.code.slice(0, MAX_CODE_LEN) : '';
  if (!code.trim()) {
    return Promise.reject(new Error('execute_code: parametro "code" mancante o vuoto.'));
  }

  log.info(`exec ${code.length} chars`);

  return new Promise<ExecuteCodeResult>((resolve) => {
    const start = performance.now();
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');

    const stdoutBuf: string[] = [];
    const stderrBuf: string[] = [];
    let settled = false;

    const finish = (extra?: { error?: string }) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      clearTimeout(timeoutHandle);
      try {
        iframe.remove();
      } catch {
        // ignore
      }
      const durationMs = Math.round(performance.now() - start);
      if (extra?.error) stderrBuf.push(extra.error);
      resolve({
        tool: 'execute_code',
        code,
        stdout: stdoutBuf.join('\n').slice(0, MAX_OUTPUT_LEN),
        stderr: stderrBuf.join('\n').slice(0, MAX_OUTPUT_LEN),
        durationMs,
      });
    };

    const onMessage = (ev: MessageEvent) => {
      // L'iframe sandboxed senza allow-same-origin ha origin "null".
      if (!ev.source || ev.source !== iframe.contentWindow) return;
      const data = ev.data as
        | { type: 'log'; payload: string }
        | { type: 'err'; payload: string }
        | { type: 'done' }
        | { type: 'fatal'; payload: string }
        | undefined;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'log') stdoutBuf.push(String(data.payload).slice(0, 500));
      else if (data.type === 'err') stderrBuf.push(String(data.payload).slice(0, 500));
      else if (data.type === 'done') finish();
      else if (data.type === 'fatal') finish({ error: String(data.payload) });
    };
    window.addEventListener('message', onMessage);

    const timeoutHandle = setTimeout(() => {
      finish({ error: `Timeout: codice oltre ${EXEC_TIMEOUT_MS}ms.` });
    }, EXEC_TIMEOUT_MS);

    // Il bootstrap nell'iframe redirige console.log/console.error a postMessage
    // e cattura le eccezioni top-level.
    const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
(function(){
  function post(type, payload){ try{ parent.postMessage({type, payload}, '*'); }catch(e){} }
  function stringify(args){
    return args.map(function(a){
      if (typeof a === 'string') return a;
      try { return JSON.stringify(a); } catch(e) { return String(a); }
    }).join(' ');
  }
  var origLog = console.log;
  console.log = function(){ post('log', stringify(Array.prototype.slice.call(arguments))); try{origLog.apply(console,arguments);}catch(e){} };
  console.error = function(){ post('err', stringify(Array.prototype.slice.call(arguments))); };
  console.warn  = function(){ post('err', stringify(Array.prototype.slice.call(arguments))); };
  window.onerror = function(msg){ post('fatal', String(msg)); return true; };
  try {
    ${code}
    post('done');
  } catch(e) {
    post('fatal', (e && e.stack) ? e.stack : String(e));
  }
})();
<\/script></body></html>`;

    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}
