"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-background to-background" />

        <div className="flex flex-col items-center gap-4 relative z-10 p-8 glass rounded-3xl">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-500" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Checking profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="mx-auto flex max-w-2xl w-full flex-col gap-8 relative z-10">
        <header className="glass p-8 rounded-3xl shadow-2xl text-center md:text-left">
          <div className="inline-flex items-center justify-center p-2 bg-indigo-500/10 rounded-lg text-indigo-400 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Required Step</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Complete your profile
          </h1>
          <p className="mt-2 text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
            We need your date of birth and gender to personalize your lab ranges and reports correctly.
          </p>
        </header>

        <section className="glass p-8 rounded-3xl shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">
                Date of birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                required
              />
              {dateError && (
                <p className="text-xs font-semibold text-red-400 mt-1 ml-1 animate-pulse">
                  {dateError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">
                Gender
              </label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                  className="w-full appearance-none bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  required
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500 dark:text-zinc-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 border-0 text-base font-semibold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canSubmit || status.type === "loading"}
            >
              {status.type === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Saving...
                </span>
              ) : "Save Profile"}
            </button>
          </form>

          {status.message && (
            <div
              className={`mt-6 rounded-xl border px-4 py-3 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${status.type === "error"
                ? "border-red-500/20 bg-red-500/10 text-red-400"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                }`}
            >
              {status.message}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
