"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Settings as SettingsIcon } from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    const { setTheme, theme } = useTheme();

    return (
        <DashboardLayout>
            <div className="space-y-8 relative z-10 animate-in fade-in duration-500">
                <header>
                    <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white mb-2">Settings</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                        Customize your LabTrack experience.
                    </p>
                </header>

                <Card className="glass border-zinc-200 dark:border-white/10 shadow-xl dark:shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-zinc-900 dark:text-white flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-indigo-500" />
                            General Preferences
                        </CardTitle>
                        <CardDescription className="text-zinc-500 dark:text-zinc-400">
                            Configure how LabTrack looks and feels.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-medium text-zinc-900 dark:text-white">Appearance</p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Select your preferred theme.</p>
                            </div>
                            <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-black/20 rounded-xl border border-zinc-200 dark:border-white/5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setTheme("light")}
                                    className={`rounded-lg gap-2 h-9 px-4 ${theme === "light"
                                        ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm"
                                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"}`}
                                >
                                    <Sun className="h-4 w-4" />
                                    Light
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setTheme("dark")}
                                    className={`rounded-lg gap-2 h-9 px-4 ${theme === "dark"
                                        ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm"
                                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"}`}
                                >
                                    <Moon className="h-4 w-4" />
                                    Dark
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setTheme("system")}
                                    className={`rounded-lg gap-2 h-9 px-4 ${theme === "system"
                                        ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm"
                                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"}`}
                                >
                                    <Monitor className="h-4 w-4" />
                                    System
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
