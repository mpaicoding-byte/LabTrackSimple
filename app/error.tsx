"use client";

import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="max-w-lg rounded-3xl border border-border bg-background p-8 shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-destructive">
            Something went wrong
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            LabTrackSimple hit an error
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {error.message || "We could not load this page. Try again."}
          </p>
          <Button type="button" onClick={reset} className="mt-6">
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
