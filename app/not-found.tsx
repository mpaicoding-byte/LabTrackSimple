import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-8 shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            404 not found
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            We could not find that page
          </h1>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            The link may be outdated, or the page might be moving. Head back to
            the LabTrackSimple home page to continue.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center rounded-full bg-slate-900 dark:bg-slate-100 px-5 py-2 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
