"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { LoadingState } from "@/components/ui/loading-state";

type Status = {
  type: "idle" | "loading" | "error" | "success";
  message: string;
};

type ProfileFormValues = {
  dateOfBirth: string;
  gender: string;
};

const genderOptions = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: string) => {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`);
};

const formatDateLabel = (value: string) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Pick a date";

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
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [dobOpen, setDobOpen] = useState(false);
  const [status, setStatus] = useState<Status>({
    type: "idle",
    message: "",
  });
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormValues>({
    defaultValues: {
      dateOfBirth: "",
      gender: "",
    },
    mode: "onSubmit",
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
      reset({
        dateOfBirth: data.date_of_birth ?? "",
        gender: data.gender ?? "",
      });
      setLoadingProfile(false);
    };

    if (!loading) {
      void loadProfile();
    }

    return () => {
      isActive = false;
    };
  }, [loading, reset, router, session, supabase]);

  const onSubmit = handleSubmit(
    async (values) => {
      if (!personId) {
        setStatus({ type: "error", message: "Missing profile record." });
        toast.error("Missing profile record.");
        return;
      }

      setStatus({ type: "loading", message: "Saving profile..." });
      const { error } = await supabase
        .from("people")
        .update({
          date_of_birth: values.dateOfBirth,
          gender: values.gender,
        })
        .eq("id", personId);

      if (error) {
        setStatus({ type: "error", message: error.message });
        toast.error(error.message);
        return;
      }

      setStatus({ type: "success", message: "Profile saved." });
      toast.success("Profile saved.");
      router.replace("/people");
    },
    () => {
      setStatus({
        type: "error",
        message: "Please provide a valid date of birth and gender.",
      });
      toast.error("Please provide a valid date of birth and gender.");
    },
  );

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
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="profile-dob">Date of birth</Label>
              <Controller
                control={control}
                name="dateOfBirth"
                rules={{
                  required: "Date of birth is required.",
                  validate: (value) =>
                    isPastDate(value) || "Date of birth must be in the past.",
                }}
                render={({ field }) => (
                  <Popover open={dobOpen} onOpenChange={setDobOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="profile-dob"
                        variant="outline"
                        aria-invalid={Boolean(errors.dateOfBirth)}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDateLabel(field.value)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={parseDateValue(field.value)}
                        onSelect={(date) => {
                          field.onChange(date ? formatDateValue(date) : "");
                          setDobOpen(false);
                        }}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.dateOfBirth?.message && (
                <p className="text-xs font-medium text-destructive">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-gender">Gender</Label>
              <Controller
                control={control}
                name="gender"
                rules={{ required: "Gender is required." }}
                render={({ field }) => {
                  const selectedLabel =
                    genderOptions.find((option) => option.value === field.value)
                      ?.label ?? "Select gender";
                  return (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="profile-gender">
                        <SelectValue>{selectedLabel}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {errors.gender?.message && (
                <p className="text-xs font-medium text-destructive">
                  {errors.gender.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={status.type === "loading" || isSubmitting}
            >
              {status.type === "loading" || isSubmitting ? (
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
