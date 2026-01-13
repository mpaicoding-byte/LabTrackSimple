"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TestTube2, Eye, EyeOff, Loader2 } from "lucide-react";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-background to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />

        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 relative z-10" />
      </div>
    );
  }

  // If already logged in, show redirecting message
  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-background to-background" />

        <div className="text-center relative z-10 glass p-8 rounded-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-500 mx-auto mb-4" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/30 text-white">
              <TestTube2 className="h-8 w-8" />
            </div>
            <span className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-white/70 bg-clip-text text-transparent">LabTrack</span>
          </div>
        </div>

        <Card className="border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl text-zinc-900 dark:text-white font-display">
              {mode === "sign-in" ? "Welcome back" : "Create your account"}
            </CardTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              {mode === "sign-in"
                ? "Sign in to access your lab reports"
                : "Start tracking your household health data"}
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Mode Toggle */}
            <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-black/20 rounded-xl mb-8 border border-zinc-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => setMode("sign-in")}
                className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-lg transition-all duration-300 ${mode === "sign-in"
                  ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm dark:shadow-lg dark:shadow-indigo-500/10 border border-zinc-200 dark:border-white/10"
                  : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/5"
                  }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("sign-up")}
                className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-lg transition-all duration-300 ${mode === "sign-up"
                  ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm dark:shadow-lg dark:shadow-indigo-500/10 border border-zinc-200 dark:border-white/10"
                  : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/5"
                  }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1"
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
                  className="bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 h-12 rounded-xl"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1"
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
                    className="bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 h-12 rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Household Name (Sign up only) */}
              {mode === "sign-up" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                  <label
                    htmlFor="household"
                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1"
                  >
                    Household name{" "}
                    <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
                  </label>
                  <Input
                    id="household"
                    type="text"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    placeholder="e.g., The Smith Family"
                    className="bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 h-12 rounded-xl"
                  />
                </div>
              )}

              {/* Status Message */}
              {status.message && (
                <div
                  className={`p-4 rounded-xl text-sm flex items-center animate-in fade-in duration-300 ${status.type === "error"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                >
                  {status.message}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={status.type === "loading"}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 border-0 text-base font-semibold"
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
        <p className="text-center text-xs text-zinc-500 mt-8">
          {mode === "sign-up"
            ? "By creating an account, you agree to our terms of service."
            : "Secure authentication powered by Supabase."}
        </p>
      </div>
    </div>
  );
};
