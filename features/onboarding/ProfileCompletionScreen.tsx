"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";

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
      <LoadingState
        fullScreen
        size="md"
        message="Checking profile..."
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-foreground">
            Complete your profile
          </h1>
          <p className="text-muted-foreground">
            Add your date of birth and gender so we can personalize your lab ranges.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="profile-dob" className="text-sm font-medium">
                Date of birth
              </label>
              <Input
                id="profile-dob"
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                required
              />
              {dateError && (
                <p className="text-xs font-medium text-destructive">{dateError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-gender" className="text-sm font-medium">
                Gender
              </label>
              <select
                id="profile-gender"
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                required
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!canSubmit || status.type === "loading"}
            >
              {status.type === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </form>

          {status.message && (
            <div
              className={`mt-4 rounded-md border px-4 py-3 text-sm ${status.type === "error"
                ? "border-destructive/40 text-destructive"
                : "border-border text-muted-foreground"
                }`}
            >
              {status.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
