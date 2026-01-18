"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import type { TrendGroup, TrendRow } from "./types";
import { buildTrendGroups, formatDate } from "./utils";
import { TrendSparkline } from "./TrendChart";
import {
  TrendsEmptyState,
  TrendsErrorState,
  TrendsLoadingState,
  TrendsSignInGate,
} from "./TrendLayoutPieces";

const wrapWithBoundary = (content: React.ReactNode) => (
  <ErrorBoundary>{content}</ErrorBoundary>
);

export const TrendsManager = () => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { session, loading: sessionLoading } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<TrendGroup[]>([]);
  const [search, setSearch] = useState("");

  const loadTrendData = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("lab_results")
        .select(
          "id, name_raw, value_raw, value_num, unit_raw, lab_report_id, lab_reports (report_date, person_id, deleted_at)",
        )
        .eq("is_final", true)
        .is("deleted_at", null)
        .is("lab_reports.deleted_at", null)
        .order("created_at", { ascending: false });

      if (queryError) {
        setError(queryError.message ?? "Unable to load trends.");
        setGroups([]);
        return;
      }

      const nextGroups = buildTrendGroups((data ?? []) as TrendRow[]);
      setGroups(nextGroups);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Unable to load trends.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id, supabase]);

  useEffect(() => {
    if (!sessionLoading) {
      void loadTrendData();
    }
  }, [sessionLoading, loadTrendData]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const query = search.trim().toLowerCase();
    return groups.filter((group) => group.name.toLowerCase().includes(query));
  }, [groups, search]);

  if (sessionLoading) {
    return <LoadingState fullScreen size="lg" />;
  }

  if (!session) {
    return wrapWithBoundary(
      <DashboardLayout>
        <TrendsSignInGate />
      </DashboardLayout>,
    );
  }

  if (loading) {
    return wrapWithBoundary(
      <DashboardLayout>
        <TrendsLoadingState />
      </DashboardLayout>,
    );
  }

  if (error) {
    return wrapWithBoundary(
      <DashboardLayout>
        <TrendsErrorState error={error} />
      </DashboardLayout>,
    );
  }

  if (groups.length === 0) {
    return wrapWithBoundary(
      <DashboardLayout>
        <TrendsEmptyState />
      </DashboardLayout>,
    );
  }

  return wrapWithBoundary(
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Trends</h1>
          <p className="text-muted-foreground">
            Track how values change across your confirmed reports.
          </p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">All tests</h2>
            <p className="text-sm text-muted-foreground">
              Compare results across reports at a glance.
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Search tests"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <Card className="gap-0 py-0">
          <CardContent className="px-0 py-0">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-64" />
                  <col />
                </colgroup>
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="sticky left-0 z-20 bg-muted/40 px-6 py-3 text-left font-semibold">
                      Test
                    </th>
                    <th className="px-6 py-3 text-left font-semibold">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredGroups.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-10 text-center text-sm text-muted-foreground"
                      >
                        No tests match \"{search.trim()}\".
                      </td>
                    </tr>
                  ) : (
                    filteredGroups.map((group) => {
                      const resultCount =
                        group.points.length + group.textEntries.length;
                      const hasNumeric = group.points.length > 0;

                      return (
                        <tr key={group.key} className="align-top">
                          <td className="sticky left-0 z-10 bg-background px-6 py-4">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-foreground">
                                {group.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {group.unit ?? "No unit"} · {resultCount} results
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {hasNumeric ? (
                              <TrendSparkline
                                points={group.points}
                                compact
                                ariaLabel={`Trend chart for ${group.name}`}
                              />
                            ) : (
                              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                                No chart
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
