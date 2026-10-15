import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

// Catches render-time crashes so the user sees a recovery option instead of a blank page
export default class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-slate-500">An unexpected error occurred in the app.</p>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
