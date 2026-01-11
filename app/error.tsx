"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-300">
            Something went wrong
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            LabTrackSimple hit an error
          </h1>
          <p className="mt-4 text-sm text-slate-300">
            {error.message || "We could not load this page. Try again."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex items-center rounded-full bg-rose-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-300"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
