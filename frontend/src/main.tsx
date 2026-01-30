import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', maxWidth: 600, margin: '40px auto' }}>
          <h1 style={{ color: '#c00', marginBottom: 16 }}>Ошибка загрузки</h1>
          <pre style={{ background: '#f5f5f5', padding: 16, overflow: 'auto', fontSize: 12 }}>
            {this.state.error.message}
          </pre>
          <p style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
            Открой консоль браузера (F12 → Console) для подробностей.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);


