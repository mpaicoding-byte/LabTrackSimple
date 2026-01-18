"use client";

import { useState } from "react";
import { Home, FileText, Users, Settings, LogOut, LogIn, TestTube2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession } from "@/features/auth/SessionProvider";
import { useAuth } from "@/features/auth/useAuth";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Reports", href: "/reports", icon: FileText },
    { label: "Trends", href: "/trends", icon: TrendingUp },
    { label: "Family / People", href: "/people", icon: Users },
    { label: "Settings", href: "/settings", icon: Settings },
];


export function AppSidebar() {
    const pathname = usePathname();
    const { session, loading } = useSession();
    const { signOut } = useAuth();
    const [signingOut, setSigningOut] = useState(false);

    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            await signOut();
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
        <Sidebar>
            <SidebarHeader>
                <Link href="/" className="flex items-center gap-3 text-xl font-bold tracking-tight text-foreground">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <TestTube2 className="h-6 w-6" />
                    </div>
                    <span>LabTrack</span>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {NAV_ITEMS.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        className={cn(
                                            isActive(item.href) && "bg-muted text-foreground",
                                        )}
                                    >
                                        <Link href={item.href} className="flex items-center gap-3">
                                            <item.icon
                                                className={cn(
                                                    "h-5 w-5",
                                                    isActive(item.href)
                                                        ? "text-foreground"
                                                        : "text-muted-foreground",
                                                )}
                                            />
                                            {item.label}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
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
            </SidebarFooter>
        </Sidebar>
    );
}
