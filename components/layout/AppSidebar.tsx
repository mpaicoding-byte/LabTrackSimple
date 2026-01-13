"use client";

import { useMemo, useState } from "react";
import { Home, FileText, Users, Settings, LogOut, LogIn, TestTube2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/SessionProvider";
import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Reports", href: "/reports", icon: FileText },
    { label: "Family / People", href: "/people", icon: Users },
    { label: "Settings", href: "/settings", icon: Settings },
];


export function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { session, loading } = useSession();
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);
    const [signingOut, setSigningOut] = useState(false);

    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            await supabase.auth.signOut();
            router.push("/auth");
        } catch (error) {
            console.error("Sign out error:", error);
        } finally {
            setSigningOut(false);
        }
    };

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-zinc-200 dark:border-white/5 bg-white/70 dark:bg-black/20 backdrop-blur-2xl lg:flex transition-colors duration-300">
            <div className="flex h-20 items-center px-6">
                <Link href="/" className="flex items-center gap-3 font-display font-bold text-xl tracking-tight text-zinc-900 dark:text-white glow-text">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white">
                        <TestTube2 className="h-6 w-6" />
                    </div>
                    <span className="bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-white/70 bg-clip-text text-transparent transition-all">LabTrack</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="flex flex-col gap-2">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                                isActive(item.href)
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 shadow-sm dark:shadow-[0_0_20px_rgba(99,102,241,0.15)] border border-indigo-200 dark:border-indigo-500/20"
                                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", isActive(item.href) ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white")} />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="border-t border-zinc-200 dark:border-white/5 p-4 bg-zinc-50/50 dark:bg-black/10 transition-colors">
                {loading ? (
                    <div className="h-12 animate-pulse rounded-xl bg-zinc-100 dark:bg-white/5" />
                ) : session ? (
                    <div className="space-y-3">
                        <div className="px-2">
                            <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">Signed in as</p>
                            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white/90">{session.user.email}</p>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            disabled={signingOut}
                            className="w-full justify-start gap-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/20 transition-all"
                        >
                            <LogOut className="h-4 w-4" />
                            {signingOut ? "Signing out..." : "Sign out"}
                        </Button>
                    </div>
                ) : (
                    <Link href="/auth">
                        <Button
                            variant="default"
                            className="w-full justify-start gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all border-0 text-white"
                        >
                            <LogIn className="h-4 w-4" />
                            Sign in
                        </Button>
                    </Link>
                )}
            </div>
        </aside>
    );
}
