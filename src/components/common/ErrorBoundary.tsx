import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-6 text-center dark:bg-gray-900">
          <div className="mb-6 rounded-full bg-error-100 p-4 dark:bg-error-900/30">
            <svg
              className="h-10 w-10 text-error-600 dark:text-error-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            An unexpected error occurred in the application.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              Reload Page
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Go to Home
            </button>
          </div>
          {import.meta.env.MODE === "development" && this.state.error && (
            <div className="mt-8 max-w-2xl overflow-auto rounded-lg bg-gray-800 p-4 text-left text-xs text-gray-300">
              <pre>{this.state.error.toString()}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
