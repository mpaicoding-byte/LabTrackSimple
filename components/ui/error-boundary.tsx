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
  <div
    role="alert"
    className="rounded-2xl border border-border bg-background p-6 text-foreground shadow-sm"
  >
    <p className="text-sm font-semibold">Something went wrong.</p>
    <p className="mt-1 text-sm text-muted-foreground">
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
