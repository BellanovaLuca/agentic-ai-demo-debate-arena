import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  err: Error | null;
  info: ErrorInfo | null;
}

// Error boundary di sviluppo: visualizza in chiaro l'eccezione che ha
// crashato il render, invece di lasciare schermo vuoto.
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { err: null, info: null };

  static getDerivedStateFromError(err: Error): Partial<State> {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', err, info);
    this.setState({ info });
  }

  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 24, color: '#fecaca', fontFamily: 'monospace', lineHeight: 1.4 }}>
          <h1 style={{ color: '#fca5a5', fontSize: 18, marginBottom: 12 }}>
            ✖ App crashata
          </h1>
          <p style={{ marginBottom: 8 }}>{this.state.err.message}</p>
          <details style={{ whiteSpace: 'pre-wrap', fontSize: 11 }}>
            <summary style={{ cursor: 'pointer' }}>stack</summary>
            {this.state.err.stack}
          </details>
          {this.state.info && (
            <details style={{ whiteSpace: 'pre-wrap', fontSize: 11, marginTop: 8 }}>
              <summary style={{ cursor: 'pointer' }}>component stack</summary>
              {this.state.info.componentStack}
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
