"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";

type Status = {
  type: "idle" | "loading" | "error" | "success";
  message: string;
};

const genderOptions = [
  { value: "", label: "Select gender" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

const isPastDate = (value: string) => {
  if (!value) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
};

export const ProfileCompletionScreen = () => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const { session, loading } = useSession();
  const [personId, setPersonId] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [status, setStatus] = useState<Status>({
    type: "idle",
    message: "",
  });

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      if (!session) {
        setLoadingProfile(false);
        router.replace("/auth");
        return;
      }

      setLoadingProfile(true);
      const { data, error } = await supabase
        .from("people")
        .select("id, date_of_birth, gender")
        .eq("user_id", session.user.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (error) {
        setStatus({ type: "error", message: error.message });
        setLoadingProfile(false);
        return;
      }

      if (!data) {
        setStatus({
          type: "error",
          message: "No profile found for this user.",
        });
        setLoadingProfile(false);
        return;
      }

      if (data.date_of_birth && data.gender) {
        router.replace("/people");
        return;
      }

      setPersonId(data.id);
      setDateOfBirth(data.date_of_birth ?? "");
      setGender(data.gender ?? "");
      setLoadingProfile(false);
    };

    if (!loading) {
      void loadProfile();
    }

    return () => {
      isActive = false;
    };
  }, [loading, router, session, supabase]);

  const dateError =
    dateOfBirth && !isPastDate(dateOfBirth)
      ? "Date of birth must be in the past."
      : "";
  const canSubmit =
    isPastDate(dateOfBirth) && (gender === "female" || gender === "male");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!personId) {
      setStatus({ type: "error", message: "Missing profile record." });
      return;
    }

    if (!canSubmit) {
      setStatus({
        type: "error",
        message: "Please provide a valid date of birth and gender.",
      });
      return;
    }

    setStatus({ type: "loading", message: "Saving profile..." });
    const { error } = await supabase
      .from("people")
      .update({
        date_of_birth: dateOfBirth,
        gender,
      })
      .eq("id", personId);

    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    setStatus({ type: "success", message: "Profile saved." });
    router.replace("/people");
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f3ea_0%,#f2efe7_50%,#e6e4df_100%)] text-slate-900">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-20">
          <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
          <p className="text-sm text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f3ea_0%,#f2efe7_50%,#e6e4df_100%)] text-slate-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="rounded-[28px] border border-slate-200/70 bg-white/75 p-8 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.55)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
            Required
          </p>
          <h1 className="mt-3 font-display text-3xl text-slate-900 sm:text-4xl">
            Complete your profile
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            We need your date of birth and gender before you can add or review
            lab reports.
          </p>
        </header>

        <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-8 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.6)] backdrop-blur">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Date of birth
              <input
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                required
              />
            </label>
            {dateError ? (
              <p className="text-xs font-semibold text-rose-600">
                {dateError}
              </p>
            ) : null}

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Gender
              <select
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                required
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={!canSubmit || status.type === "loading"}
            >
              Save profile
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
        </section>
      </div>
    </div>
  );
};
