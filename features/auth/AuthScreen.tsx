"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";

type AuthMode = "sign-in" | "sign-up";

type Status = {
  type: "idle" | "loading" | "error" | "success";
  message: string;
};

export const AuthScreen = () => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { session, loading } = useSession();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [status, setStatus] = useState<Status>({
    type: "idle",
    message: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "loading", message: "Working on it..." });

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatus({ type: "error", message: error.message });
        return;
      }

      setStatus({
        type: "success",
        message: "Signed in. Your session is ready.",
      });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          household_name: householdName.trim() || null,
        },
      },
    });

    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    setStatus({
      type: "success",
      message:
        "Account created. We will bootstrap your household automatically.",
    });
  };

  const handleSignOut = async () => {
    setStatus({ type: "loading", message: "Signing out..." });
    const { error } = await supabase.auth.signOut();

    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    setStatus({ type: "success", message: "Signed out." });
  };

  const headline =
    mode === "sign-in" ? "Welcome back" : "Create your household";
  const subhead =
    mode === "sign-in"
      ? "Pick up where your lab reviews left off."
      : "Start a private, shared place for your household lab records.";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f3ea_0%,#f4efe4_45%,#e6e5e1_100%)] text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1.1fr,0.9fr] lg:px-10">
        <aside className="flex flex-col justify-between gap-12 rounded-[32px] border border-slate-200/70 bg-white/70 p-10 shadow-[0_25px_80px_-60px_rgba(15,23,42,0.6)] backdrop-blur">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-100">
              LabTrackSimple
            </div>
            <h1 className="font-display text-4xl leading-tight text-slate-900 sm:text-5xl">
              Calm signal,
              <br />
              clear cadence.
            </h1>
            <p className="text-base leading-7 text-slate-600 sm:text-lg">
              Focus on the data that matters. Capture lab reports, stage
              extracted results, and review trends without the noise.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: "Household-first",
                value: "Owner-led privacy",
              },
              {
                label: "Review ready",
                value: "Human-approved results",
              },
              {
                label: "Traceable",
                value: "Artifacts stay connected",
              },
              {
                label: "Trend friendly",
                value: "Numeric + text history",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white/90 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-8 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl text-slate-900">
                {headline}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{subhead}</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Phase 2
            </span>
          </div>

          <div className="mt-6 flex gap-2 rounded-full bg-slate-100 p-1 text-sm font-medium">
            {[
              { id: "sign-in", label: "Sign in" },
              { id: "sign-up", label: "Create account" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id as AuthMode)}
                className={`flex-1 rounded-full px-3 py-2 transition ${
                  mode === item.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-600"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                placeholder="Create a strong passphrase"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                required
              />
            </label>

            {mode === "sign-up" ? (
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Household label (optional)
                <input
                  type="text"
                  value={householdName}
                  onChange={(event) => setHouseholdName(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                  placeholder="The Martinez household"
                />
              </label>
            ) : null}

            <button
              type="submit"
              disabled={loading || status.type === "loading"}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {mode === "sign-in" ? "Sign in" : "Create account"}
            </button>
          </form>

          {status.message ? (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                status.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {status.message}
            </div>
          ) : null}

          {session ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-sm font-semibold text-slate-700">
                Signed in as
              </p>
              <p className="mt-1 text-sm text-slate-500">{session.user.email}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/people"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Manage people
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : null}

          <p className="mt-6 text-xs text-slate-500">
            New households are created automatically on sign up. If email
            confirmation is enabled, confirm the email and sign in to continue.
          </p>
        </section>
      </div>
    </div>
  );
};
