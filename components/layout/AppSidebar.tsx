"use client";

import { useMemo, useState } from "react";
import { Home, FileText, Users, Settings, LogOut, LogIn, TestTube2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/SessionProvider";
import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Reports", href: "/reports", icon: FileText },
    { label: "Trends", href: "/trends", icon: TrendingUp },
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
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-border bg-background lg:flex">
            <div className="flex h-20 items-center px-6">
                <Link href="/" className="flex items-center gap-3 text-xl font-bold tracking-tight text-foreground">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <TestTube2 className="h-6 w-6" />
                    </div>
                    <span>LabTrack</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="flex flex-col gap-2">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors",
                                isActive(item.href)
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive(item.href) ? "text-foreground" : "text-muted-foreground")} />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="border-t border-border p-4">
                {loading ? (
                    <div className="h-12 animate-pulse rounded-md bg-muted" />
                ) : session ? (
                    <div className="space-y-3">
                        <div className="px-2">
                            <p className="truncate text-xs font-medium text-muted-foreground">Signed in as</p>
                            <p className="truncate text-sm font-semibold text-foreground">{session.user.email}</p>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            disabled={signingOut}
                            className="w-full justify-start gap-3"
                        >
                            <LogOut className="h-4 w-4" />
                            {signingOut ? "Signing out..." : "Sign out"}
                        </Button>
                    </div>
                ) : (
                    <Link href="/auth">
                        <Button
                            variant="default"
                            className="w-full justify-start gap-3"
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
