"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/SessionProvider";
import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import {
  FileText,
  Users,
  Upload,
  TrendingUp,
  Clock,
  UserPlus,
  ArrowRight,
  Activity,
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  totalReports: number;
  totalPeople: number;
  recentReports: number;
  pendingReview: number;
}

interface RecentReport {
  id: string;
  report_date: string;
  source: string | null;
  person_id: string;
}

interface PersonMap {
  [key: string]: string;
}


export default function DashboardPage() {
  const { session, loading: sessionLoading } = useSession();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    totalPeople: 0,
    recentReports: 0,
    pendingReview: 0,
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [peopleMap, setPeopleMap] = useState<PersonMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch total reports count
        const { count: reportsCount } = await supabase
          .from("lab_reports")
          .select("*", { count: "exact", head: true });

        // Fetch total people count
        const { count: peopleCount } = await supabase
          .from("people")
          .select("*", { count: "exact", head: true });

        // Fetch reports from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count: recentCount } = await supabase
          .from("lab_reports")
          .select("*", { count: "exact", head: true })
          .gte("report_date", thirtyDaysAgo.toISOString().split("T")[0]);

        // Fetch people for name lookup
        const { data: peopleData } = await supabase
          .from("people")
          .select("id, name");

        const nameMap: PersonMap = {};
        if (peopleData) {
          peopleData.forEach((p) => {
            nameMap[p.id] = p.name;
          });
        }
        setPeopleMap(nameMap);

        // Fetch recent reports for activity feed (simplified query)
        const { data: recent } = await supabase
          .from("lab_reports")
          .select("id, report_date, source, person_id")
          .order("created_at", { ascending: false })
          .limit(5);

        setStats({
          totalReports: reportsCount || 0,
          totalPeople: peopleCount || 0,
          recentReports: recentCount || 0,
          pendingReview: 0, // Placeholder for future status tracking
        });

        setRecentReports((recent as RecentReport[]) || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session, supabase]);

  // Show sign-in prompt if not authenticated
  if (!sessionLoading && !session) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 glass p-12 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-8 mx-auto">
              <Activity className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-display font-bold mb-4 bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">Welcome to LabTrack</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md text-lg leading-relaxed">
              Your personal health command center. Sign in to visualize your lab history and manage household health data.
            </p>
            <Link href="/auth">
              <Button size="lg" className="h-12 px-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 relative">
        {/* Background Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <header className="relative z-10">
          <h1 className="text-4xl font-display font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">
            Overview of your household health metrics.
          </p>
        </header>

        {/* Quick Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative z-10">
          <Card className="group relative overflow-hidden border-zinc-200 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-500 shadow-sm dark:shadow-none">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Reports</CardTitle>
              <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-zinc-900 dark:text-white">
                {loading ? "..." : stats.totalReports}
              </div>
              <p className="text-xs text-zinc-500 mt-1">All time lab reports</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-zinc-200 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-500 shadow-sm dark:shadow-none">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Family Members</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-zinc-900 dark:text-white">
                {loading ? "..." : stats.totalPeople}
              </div>
              <p className="text-xs text-zinc-500 mt-1">People in your household</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-zinc-200 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-500 shadow-sm dark:shadow-none">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Recent Reports</CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-zinc-900 dark:text-white">
                {loading ? "..." : stats.recentReports}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Added in last 30 days</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-zinc-200 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-500 shadow-sm dark:shadow-none">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Insights</CardTitle>
              <div className="p-2 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 text-pink-500 dark:text-pink-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-display font-bold text-pink-500 dark:text-pink-400/90">Coming Soon</div>
              <p className="text-xs text-zinc-500 mt-1">Trend analysis AI</p>
            </CardContent>
          </Card>
        </div>

        {/* Extended Section */}
        <div className="grid gap-8 lg:grid-cols-2 relative z-10">
          {/* Quick Actions */}
          <Card className="border-zinc-200 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-sm dark:shadow-none">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-900 dark:text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/reports" className="block group">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-zinc-900 dark:text-white">Upload Lab Report</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">Add a new PDF or image</div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-white/10 transition-colors">
                    <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
                  </div>
                </div>
              </Link>

              <Link href="/people" className="block group">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-zinc-900 dark:text-white">Manage People</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">Add or edit family members</div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-white/10 transition-colors">
                    <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
                  </div>
                </div>
              </Link>

              <Link href="/reports" className="block group">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200 dark:hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-zinc-900 dark:text-white">View All Reports</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">Browse your lab history</div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-white/10 transition-colors">
                    <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-zinc-200 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-xl flex flex-col shadow-sm dark:shadow-none">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-900 dark:text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-white/5"
                    />
                  ))}
                </div>
              ) : recentReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 text-zinc-400 dark:text-zinc-600">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium">No reports yet</p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-600 mt-1">
                    Upload your first lab report to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentReports.map((report) => (
                    <Link
                      key={report.id}
                      href={`/reports`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 hover:bg-white/80 dark:hover:bg-white/[0.08] transition-all hover:scale-[1.02]"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 border border-zinc-200 dark:border-white/5">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-white truncate">
                          {peopleMap[report.person_id] || "Unknown Person"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-zinc-500 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                            {report.source || "Lab Report"}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-600">
                            {new Date(report.report_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-400" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Banner (show only if no reports) */}
        {!loading && stats.totalReports === 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-1 shadow-2xl shadow-indigo-500/30">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/20 blur-3xl pointer-events-none"></div>

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 bg-white/10 dark:bg-black/20 backdrop-blur-xl p-8 rounded-xl h-full">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Get started with LabTrack
                </h3>
                <p className="text-indigo-100 text-lg opacity-90">
                  Upload your first lab report to begin tracking your health data effectively.
                </p>
              </div>
              <Link href="/reports">
                <Button
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-indigo-50 border-0 h-14 px-8 text-base font-semibold shadow-xl rounded-full"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload First Report
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
