export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Loading
          </p>
          <p className="mt-3 text-lg font-semibold">Preparing LabTrackSimple</p>
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
