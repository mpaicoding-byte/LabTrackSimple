"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";
import type { ReviewRow } from "./types";

const BUCKET_ID = "lab-artifacts";

type ReportRow = {
  id: string;
  household_id: string;
  person_id: string;
  report_date: string;
  status: "draft" | "review_required" | "final" | "extraction_failed";
  current_extraction_run_id: string | null;
};

export const useReviewData = (reportId?: string) => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id ?? null;

  const [role, setRole] = useState<string | null>(null);
  const [report, setReport] = useState<ReportRow | null>(null);
  const [personName, setPersonName] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadReviewData = useCallback(async () => {
    if (!userId) return;
    if (!reportId) {
      setError("Missing report ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: reportData, error: reportError } = await supabase
        .from("lab_reports")
        .select("id, household_id, person_id, report_date, status, current_extraction_run_id")
        .eq("id", reportId)
        .maybeSingle();

      if (reportError || !reportData) {
        setError(reportError?.message ?? "Report not found.");
        setLoading(false);
        return;
      }

      setReport(reportData as ReportRow);

      const { data: memberData } = await supabase
        .from("household_members")
        .select("role")
        .eq("user_id", userId)
        .eq("household_id", reportData.household_id)
        .is("deleted_at", null)
        .maybeSingle();

      if (!memberData) {
        setError("Unable to determine household role.");
        setLoading(false);
        return;
      }

      setRole(memberData.role);

      const { data: personData } = await supabase
        .from("people")
        .select("name")
        .eq("id", reportData.person_id)
        .maybeSingle();

      setPersonName(personData?.name ?? null);

      const latestRun = reportData.current_extraction_run_id ?? null;
      setRunId(latestRun);

      if (!latestRun) {
        setRows([]);
      } else {
        const { data: resultRows } = await supabase
          .from("lab_results")
          .select(
            "id, name_raw, value_raw, unit_raw, value_num, details_raw, edited_at",
          )
          .eq("lab_report_id", reportId)
          .eq("extraction_run_id", latestRun)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });

        setRows((resultRows ?? []) as ReviewRow[]);
      }

      const { data: artifact } = await supabase
        .from("lab_artifacts")
        .select("object_path")
        .eq("lab_report_id", reportId)
        .eq("status", "ready")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (artifact?.object_path) {
        const { data: signed } = await supabase.storage
          .from(BUCKET_ID)
          .createSignedUrl(artifact.object_path, 60 * 30);

        setPreviewUrl(signed?.signedUrl ?? null);
      } else {
        setPreviewUrl(null);
      }
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load review data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [reportId, supabase, userId]);

  useEffect(() => {
    if (!sessionLoading) {
      void loadReviewData();
    }
  }, [sessionLoading, loadReviewData]);

  return {
    supabase,
    session,
    sessionLoading,
    role,
    report,
    setReport,
    personName,
    runId,
    rows,
    setRows,
    loading,
    error,
    previewUrl,
    reload: loadReviewData,
  };
};
