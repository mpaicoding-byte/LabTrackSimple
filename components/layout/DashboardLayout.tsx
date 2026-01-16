import Link from "next/link";
import { TestTube2 } from "lucide-react";

import { AppSidebar } from "./AppSidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <AppSidebar />
            <main className="lg:pl-64">
                <header
                    data-testid="mobile-header"
                    className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl lg:hidden dark:border-white/5 dark:bg-black/40"
                >
                    <div className="flex items-center justify-between px-4 py-3">
                        <Link
                            href="/"
                            className="flex items-center gap-2 font-display text-base font-semibold text-zinc-900 dark:text-white"
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                                <TestTube2 className="h-5 w-5" />
                            </span>
                            <span>LabTrack</span>
                        </Link>
                        <nav className="flex items-center gap-2 text-xs font-medium">
                            <Link
                                href="/"
                                className="rounded-full border border-zinc-200/80 bg-white px-3 py-1 text-zinc-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/reports"
                                className="rounded-full border border-zinc-200/80 bg-white px-3 py-1 text-zinc-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                            >
                                Reports
                            </Link>
                            <Link
                                href="/people"
                                className="rounded-full border border-zinc-200/80 bg-white px-3 py-1 text-zinc-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                            >
                                People
                            </Link>
                        </nav>
                    </div>
                </header>
                <div className="px-4 py-8 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
