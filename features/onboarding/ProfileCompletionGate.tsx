"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";

export const ProfileCompletionGate = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { session, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isActive = true;

    const runGate = async () => {
      if (loading) {
        return;
      }

      if (!session) {
        if (pathname === "/onboarding/profile") {
          router.replace("/auth");
        }
        if (isActive) {
          setChecking(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("people")
        .select("date_of_birth, gender")
        .eq("user_id", session.user.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (error) {
        setChecking(false);
        return;
      }

      const needsCompletion = !data?.date_of_birth || !data?.gender;

      if (needsCompletion && pathname !== "/onboarding/profile") {
        router.replace("/onboarding/profile");
        return;
      }

      if (!needsCompletion && pathname === "/onboarding/profile") {
        router.replace("/people");
        return;
      }

      setChecking(false);
    };

    void runGate();

    return () => {
      isActive = false;
    };
  }, [loading, pathname, router, session, supabase]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-20">
          <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
