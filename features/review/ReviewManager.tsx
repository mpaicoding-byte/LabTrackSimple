"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ReviewGrid } from "./ReviewGrid";
import {
  ReviewEmptyState,
  ReviewErrorState,
  ReviewHeader,
  ReviewLoadingState,
  ReviewPreviewCard,
  ReviewSignInGate,
} from "./ReviewLayoutPieces";
import { useReviewActions } from "./useReviewActions";
import { useReviewData } from "./useReviewData";

const wrapWithBoundary = (content: React.ReactNode) => (
  <ErrorBoundary>{content}</ErrorBoundary>
);

type ReportNotice = {
  tone: "success" | "error";
  message: string;
};

export const ReviewManager = ({ reportId }: { reportId?: string }) => {
  const params = useParams<{ reportId?: string }>();
  const resolvedReportId = reportId ?? params?.reportId;

  const {
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
    previewKind,
  } = useReviewData(resolvedReportId);

  const [notice, setNotice] = useState<ReportNotice | null>(null);

  const editedCount = useMemo(
    () => rows.filter((row) => row.edited_at).length,
    [rows],
  );

  const {
    drafts,
    savingRows,
    commitSaving,
    hasDirty,
    handleEdit,
    handleDraftChange,
    handleCancel,
    handleSave,
    handleCommit,
    handleNotCorrect,
  } = useReviewActions({
    supabase,
    reportId: resolvedReportId,
    runId,
    rows,
    setRows,
    setNotice,
    onCommitSuccess: () =>
      setReport((prev) => (prev ? { ...prev, status: "final" } : prev)),
  });

  const canCommit =
    role === "owner" &&
    !commitSaving &&
    !hasDirty &&
    rows.length > 0 &&
    Boolean(runId);

  if (!sessionLoading && !session) {
    return wrapWithBoundary(
      <DashboardLayout>
        <ReviewSignInGate />
      </DashboardLayout>,
    );
  }

  if (loading) {
    return wrapWithBoundary(
      <DashboardLayout>
        <ReviewLoadingState />
      </DashboardLayout>,
    );
  }

  if (error) {
    return wrapWithBoundary(
      <DashboardLayout>
        <ReviewErrorState error={error} />
      </DashboardLayout>,
    );
  }

  if (!runId || rows.length === 0) {
    return wrapWithBoundary(
      <DashboardLayout>
        <ReviewEmptyState />
      </DashboardLayout>,
    );
  }

  return wrapWithBoundary(
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <ReviewHeader
          personName={personName}
          reportDate={report?.report_date ?? null}
          notice={notice}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="border-zinc-200">
            <CardHeader>
              <CardTitle>Extracted results</CardTitle>
              <CardDescription>
                {role === "owner"
                  ? "Quickly confirm the extracted values or make edits."
                  : "Review-only access. Ask an owner to confirm."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasDirty && (
                <p className="text-xs text-amber-600">Unsaved edits are pending.</p>
              )}
              <ReviewGrid
                rows={rows}
                drafts={drafts}
                savingRows={savingRows}
                readOnly={role !== "owner"}
                onEdit={handleEdit}
                onDraftChange={handleDraftChange}
                onCancel={handleCancel}
                onSave={handleSave}
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-zinc-500">
                  {rows.length} results · {editedCount} edited
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleNotCorrect}
                    disabled={commitSaving || role !== "owner"}
                  >
                    Not correct
                  </Button>
                  <Button onClick={handleCommit} disabled={!canCommit}>
                    {commitSaving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm & Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <ReviewPreviewCard previewUrl={previewUrl} previewKind={previewKind} />
        </div>
      </div>
    </DashboardLayout>
  );
};
