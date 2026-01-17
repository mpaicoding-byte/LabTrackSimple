"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <Card className="w-full max-w-lg">
            <CardHeader className="items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Activity className="h-8 w-8" />
              </div>
              <CardTitle className="text-3xl">Welcome to LabTrackSimple</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-base">
                Sign in to visualize your lab history and manage household health data.
              </p>
              <Button size="lg" asChild>
                <Link href="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Overview of your household health metrics.
          </p>
        </header>

        {/* Quick Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative z-10">
          <Card className="group relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? (
                  <Skeleton data-testid="stats-skeleton" className="h-8 w-16" />
                ) : (
                  stats.totalReports
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time lab reports</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Family Members</CardTitle>
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? (
                  <Skeleton data-testid="stats-skeleton" className="h-8 w-16" />
                ) : (
                  stats.totalPeople
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">People in your household</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Reports</CardTitle>
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? (
                  <Skeleton data-testid="stats-skeleton" className="h-8 w-12" />
                ) : (
                  stats.recentReports
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Added in last 30 days</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Insights</CardTitle>
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">Coming Soon</div>
              <p className="text-xs text-muted-foreground mt-1">Trend analysis AI</p>
            </CardContent>
          </Card>
        </div>

        {/* Extended Section */}
        <div className="grid gap-8 lg:grid-cols-2 relative z-10">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/reports" className="block group">
                <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50">
                  <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">Upload Lab Report</div>
                    <div className="text-sm text-muted-foreground">Add a new PDF or image</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>

              <Link href="/people" className="block group">
                <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50">
                  <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">Manage People</div>
                    <div className="text-sm text-muted-foreground">Add or edit family members</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>

              <Link href="/reports" className="block group">
                <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50">
                  <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">View All Reports</div>
                    <div className="text-sm text-muted-foreground">Browse your lab history</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      data-testid="recent-skeleton"
                      className="h-16 rounded-xl bg-muted"
                    />
                  ))}
                </div>
              ) : recentReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <p className="text-muted-foreground font-medium">No reports yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your first lab report to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentReports.map((report) => (
                    <Link
                      key={report.id}
                      href={`/reports`}
                      className="flex items-center gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {peopleMap[report.person_id] || "Unknown Person"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {report.source || "Lab Report"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.report_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Banner (show only if no reports) */}
        {!loading && stats.totalReports === 0 && (
          <Card>
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 py-8">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Get started with LabTrack
                </h3>
                <p className="text-muted-foreground text-lg">
                  Upload your first lab report to begin tracking your health data effectively.
                </p>
              </div>
              <Button size="lg" asChild>
                <Link href="/reports">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload First Report
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
