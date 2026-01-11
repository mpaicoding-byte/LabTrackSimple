export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-100 to-slate-200 text-slate-900">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 py-16 sm:px-10">
        <header className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
              MVP in progress
            </span>
          </div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
            LabTrackSimple
          </h1>
          <p className="max-w-2xl text-lg text-slate-700 sm:text-xl">
            Keep household lab results clear, searchable, and easy to review.
            This is the placeholder home for the first milestone build.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Capture",
              detail:
                "Upload lab artifacts and capture report context with a clean intake flow.",
            },
            {
              title: "Review",
              detail:
                "Stage extracted values, edit details, and approve results before publishing.",
            },
            {
              title: "Track",
              detail:
                "Search and visualize trends by person to keep households aligned.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur"
            >
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {card.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm backdrop-blur">
          <h3 className="text-xl font-semibold">Coming next</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              "Sign in and household bootstrap",
              "People management and roles",
              "Report capture with artifact uploads",
              "Review grid for extracted results",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-slate-100"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
