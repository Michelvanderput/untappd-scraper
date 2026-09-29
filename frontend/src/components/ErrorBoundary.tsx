import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6" role="alert">
          <div className="max-w-md w-full text-center">
            <div className="inline-grid place-items-center w-16 h-16 rounded-full border border-dashed border-ember/40 text-ember mb-6">
              <AlertTriangle className="w-7 h-7" aria-hidden />
            </div>
            <h2 className="font-display italic font-extrabold text-3xl mb-2">Er ging iets mis</h2>
            <p className="text-muted mb-6">De pagina kon niet worden geladen. Probeer het opnieuw.</p>
            <button type="button" onClick={this.handleRetry} className="btn-primary">
              <RefreshCw className="w-4 h-4" />
              Opnieuw proberen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
