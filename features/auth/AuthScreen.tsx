"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TestTube2, Eye, EyeOff, Loader2 } from "lucide-react";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";

type AuthMode = "sign-in" | "sign-up";

type Status = {
  type: "idle" | "loading" | "error" | "success";
  message: string;
};

export const AuthScreen = () => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { session, loading: sessionLoading } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [status, setStatus] = useState<Status>({
    type: "idle",
    message: "",
  });

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (!sessionLoading && session) {
      router.push("/");
    }
  }, [session, sessionLoading, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "loading", message: "" });

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatus({ type: "error", message: error.message });
        return;
      }

      setStatus({ type: "success", message: "Signed in successfully!" });
      router.push("/");
      return;
    }

    // Sign up mode
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
      message: "Account created! Check your email to confirm your account.",
    });
  };

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <TestTube2 className="h-7 w-7" />
            </div>
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              LabTrack
            </span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">
              {mode === "sign-in" ? "Welcome back" : "Create your account"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === "sign-in"
                ? "Sign in to access your lab reports"
                : "Start tracking your household health data"}
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted p-1">
              <Button
                type="button"
                onClick={() => setMode("sign-in")}
                variant={mode === "sign-in" ? "secondary" : "ghost"}
                size="sm"
              >
                Sign in
              </Button>
              <Button
                type="button"
                onClick={() => setMode("sign-up")}
                variant={mode === "sign-up" ? "secondary" : "ghost"}
                size="sm"
              >
                Create account
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "sign-in" ? "Enter your password" : "Create a password"}
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Household Name (Sign up only) */}
              {mode === "sign-up" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                  <label
                    htmlFor="household"
                    className="text-sm font-medium"
                  >
                    Household name{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Input
                    id="household"
                    type="text"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    placeholder="e.g., The Smith Family"
                  />
                </div>
              )}

              {/* Status Message */}
              {status.message && (
                <div
                  className={`rounded-md border px-4 py-3 text-sm ${status.type === "error"
                    ? "border-destructive/30 text-destructive"
                    : "border-border text-muted-foreground"
                    }`}
                >
                  {status.message}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={status.type === "loading"}
                className="w-full"
                size="lg"
              >
                {status.type === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {mode === "sign-in" ? "Signing in..." : "Creating account..."}
                  </>
                ) : mode === "sign-in" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          {mode === "sign-up"
            ? "By creating an account, you agree to our terms of service."
            : "Secure authentication powered by Supabase."}
        </p>
      </div>
    </div>
  );
};
