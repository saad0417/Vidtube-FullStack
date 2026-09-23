import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Catches render-time crashes so a single broken component can't blank the
 * whole app. React has no hook equivalent for this, so it stays a class.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-dark-base px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-display font-bold text-white">Something broke on this page</h1>
        <p className="text-sm text-gray-400 max-w-sm">
          The error has been logged to the console. Reloading usually clears it.
        </p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-2">
          Reload page
        </button>
      </div>
    );
  }
}
