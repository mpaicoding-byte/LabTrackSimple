"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TestTube2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { useSession } from "@/features/auth/SessionProvider";
import { useAuth } from "@/features/auth/useAuth";
import { LoadingState } from "@/components/ui/loading-state";
import {
  LoginForm,
  type LoginFormMode,
  type LoginFormValues,
} from "@/components/login-form";
import { toast } from "sonner";

export const AuthScreen = () => {
  const { session, loading: sessionLoading } = useSession();
  const { signIn, signUp, loading: authLoading, error, clearError } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<LoginFormMode>("sign-in");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      householdName: "",
    },
  });

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (!sessionLoading && session) {
      router.push("/");
    }
  }, [session, sessionLoading, router]);

  const handleModeChange = (nextMode: LoginFormMode) => {
    setMode(nextMode);
    clearError();
    clearErrors();
    if (nextMode === "sign-in") {
      setValue("householdName", "");
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    clearError();

    if (mode === "sign-in") {
      const result = await signIn(data.email, data.password);
      if (!result.success) {
        toast.error(result.error ?? "Failed to sign in.");
        return;
      }
      toast.success("Signed in successfully!");
      return;
    }

    const result = await signUp(data.email, data.password, {
      household_name: data.householdName?.trim() || null,
    });

    if (!result.success) {
      toast.error(result.error ?? "Failed to create account.");
      return;
    }

    toast.success("Account created! Check your email to confirm your account.");
  });

  // Show loading while checking session
  if (sessionLoading) {
    return <LoadingState fullScreen size="lg" />;
  }

  // If already logged in, show redirecting message
  if (session) {
    return (
      <LoadingState
        fullScreen
        size="md"
        message="Redirecting to dashboard..."
      />
    );
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
            <TestTube2 className="size-4" />
          </div>
          <span>LabTrack</span>
        </div>
        <LoginForm
          mode={mode}
          onModeChange={handleModeChange}
          onSubmit={onSubmit}
          register={register}
          errors={errors}
          loading={authLoading}
          authError={error}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />
      </div>
    </div>
  );
};
