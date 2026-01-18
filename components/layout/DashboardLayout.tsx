import Link from "next/link";
import { TestTube2 } from "lucide-react";

import { AppSidebar } from "./AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header
                    data-testid="mobile-header"
                    className="sticky top-0 z-20 border-b border-border bg-background lg:hidden"
                >
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="lg:hidden" />
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-base font-semibold text-foreground"
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                    <TestTube2 className="h-5 w-5" />
                                </span>
                                <span>LabTrack</span>
                            </Link>
                        </div>
                        <nav className="flex items-center gap-2 text-xs font-medium">
                            <Link
                                href="/"
                                className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground transition hover:text-foreground"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/reports"
                                className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground transition hover:text-foreground"
                            >
                                Reports
                            </Link>
                            <Link
                                href="/people"
                                className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground transition hover:text-foreground"
                            >
                                People
                            </Link>
                        </nav>
                    </div>
                </header>
                <div className="px-4 py-8 sm:px-6 lg:px-8">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
