"use client";

import * as React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

const defaultFallback = (
  <div role="alert" className="rounded-2xl border border-zinc-200 bg-white/80 p-6 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
    <p className="text-sm font-semibold">Something went wrong.</p>
    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
      Please refresh the page and try again.
    </p>
  </div>
);

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? defaultFallback;
    }

    return this.props.children;
  }
}
