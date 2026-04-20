import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertIcon } from './icons';
import { Button } from './ui/Button';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  scope?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('ErrorBoundary caught error', {
      scope: this.props.scope ?? 'unknown',
      error: { message: error.message, name: error.name, stack: error.stack },
      componentStack: info.componentStack,
    });
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return <DefaultFallback error={error} onReset={this.reset} />;
  }
}

function DefaultFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 shadow-sm">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <AlertIcon />
          Something went wrong
        </div>
        <p className="mb-3 text-[13px] text-red-700">
          The designer hit an unexpected error. Your work is preserved locally —
          try resetting this panel or refresh the page.
        </p>
        <details className="mb-3 rounded bg-white/60 p-2 font-mono text-[11px] text-red-900">
          <summary className="cursor-pointer select-none">
            Error details
          </summary>
          <div className="mt-1 whitespace-pre-wrap break-words">
            {error.name}: {error.message}
          </div>
        </details>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={onReset}>
            Try again
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>
        </div>
      </div>
    </div>
  );
}
