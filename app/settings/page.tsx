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
                    <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
                    <p className="text-muted-foreground text-lg">
                        Customize your LabTrack experience.
                    </p>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5" />
                            General Preferences
                        </CardTitle>
                        <CardDescription>Configure how LabTrack looks and feels.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-medium">Appearance</p>
                                <p className="text-sm text-muted-foreground">Select your preferred theme.</p>
                            </div>
                            <div className="flex items-center gap-2 p-1 rounded-md border bg-muted">
                                <Button
                                    variant={theme === "light" ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setTheme("light")}
                                >
                                    <Sun className="h-4 w-4" />
                                    Light
                                </Button>
                                <Button
                                    variant={theme === "dark" ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setTheme("dark")}
                                >
                                    <Moon className="h-4 w-4" />
                                    Dark
                                </Button>
                                <Button
                                    variant={theme === "system" ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setTheme("system")}
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
