"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";

type AuthResult = { success: true } | { success: false; error: string };

export const useAuth = () => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setLoading(true);
      setError(null);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (signInError) {
        setError(signInError.message);
        return { success: false, error: signInError.message };
      }
      router.push("/");
      return { success: true };
    },
    [router, supabase],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: Record<string, unknown>,
    ): Promise<AuthResult> => {
      setLoading(true);
      setError(null);
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return { success: false, error: signUpError.message };
      }
      return { success: true };
    },
    [supabase],
  );

  const signOut = useCallback(async (): Promise<AuthResult> => {
    setLoading(true);
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    setLoading(false);
    if (signOutError) {
      setError(signOutError.message);
      return { success: false, error: signOutError.message };
    }
    router.push("/auth");
    return { success: true };
  }, [router, supabase]);

  const clearError = () => setError(null);

  return { signIn, signUp, signOut, loading, error, clearError };
};
