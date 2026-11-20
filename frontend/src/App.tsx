import React from 'react';
import { CtfStudio } from './components/ctf-studio';
import { Toaster } from 'sonner';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("CTF Studio Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#090B10] p-6 text-foreground font-mono">
          <div className="max-w-md rounded-lg border border-red-500/30 bg-[#111620] p-6 shadow-xl text-center">
            <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-red-500/20 text-red-400 font-bold">
              !
            </div>
            <h2 className="text-sm font-semibold text-foreground">View Encountered an Error</h2>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed break-words">
              {this.state.error?.message || "An unexpected error occurred while rendering the interface."}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.hash = "";
                  window.location.reload();
                }}
                className="rounded bg-[#A3E635] px-4 py-2 text-xs font-semibold text-[#090B10] hover:bg-[#A3E635]/90 transition"
              >
                Reload Studio
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <AppErrorBoundary>
      <CtfStudio />
      <Toaster theme="dark" position="bottom-right" richColors />
    </AppErrorBoundary>
  );
}

export default App;
