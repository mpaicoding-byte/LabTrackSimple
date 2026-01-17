"use client";

import { useEffect, useMemo, useState } from "react";
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
  } = useReviewData(resolvedReportId);

  const [notice, setNotice] = useState<ReportNotice | null>(null);

  const editedCount = useMemo(
    () => rows.filter((row) => row.edited_at).length,
    [rows],
  );

  const {
    drafts,
    newRows,
    commitSaving,
    hasDirty,
    handleExistingDraftChange,
    handleAddRow,
    handleNewRowChange,
    handleRemoveNewRow,
    handleDiscardDraft,
    handleCommit,
  } = useReviewActions({
    supabase,
    reportId: resolvedReportId,
    personId: report?.person_id ?? null,
    runId,
    rows,
    setRows,
    setNotice,
    onCommitSuccess: () => {
      setReport((prev) => (prev ? { ...prev, status: "final" } : prev));
      setIsEditingFinal(false);
    },
  });

  const totalRows = rows.length + newRows.length;
  const isFinal = report?.status === "final";
  const [isEditingFinal, setIsEditingFinal] = useState(false);
  const canEdit = role === "owner" && (!isFinal || isEditingFinal);
  const canEnterEdit = role === "owner" && isFinal && !isEditingFinal;
  const canDiscardDraft = role === "owner" && isFinal && isEditingFinal;

  const canCommit =
    canEdit &&
    !commitSaving &&
    totalRows > 0 &&
    Boolean(runId);

  useEffect(() => {
    if (!isFinal && isEditingFinal) {
      setIsEditingFinal(false);
    }
  }, [isFinal, isEditingFinal]);

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

  if (!runId) {
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
          previewUrl={previewUrl}
        />

        <div className="grid gap-6">
          <Card className="border-zinc-200">
            <CardHeader>
              <CardTitle>Extracted results</CardTitle>
              <CardDescription>
                {isFinal
                  ? isEditingFinal
                    ? "Draft mode is active. Review updates and confirm when ready."
                    : "This report is confirmed. Select edit to make changes."
                  : role === "owner"
                    ? "Review the extracted values and add missing tests."
                    : "Review-only access. Ask an owner to confirm."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {totalRows === 0 ? (
                <p className="text-sm text-zinc-600">No results yet.</p>
              ) : null}
              {hasDirty && canEdit && (
                <p className="text-xs text-amber-600">
                  Changes are saved when you confirm.
                </p>
              )}
              <ReviewGrid
                rows={rows}
                drafts={drafts}
                newRows={newRows}
                readOnly={!canEdit}
                onExistingDraftChange={handleExistingDraftChange}
                onNewRowChange={handleNewRowChange}
                onRemoveNewRow={handleRemoveNewRow}
              />

              {canEdit && previewUrl && (
                <p className="text-xs text-zinc-500">
                  Tip: Add missing tests only if they appear in this uploaded report.
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-zinc-500">
                  {rows.length} results · {editedCount} edited
                </p>
                <div className="flex flex-wrap gap-2">
                  {canEnterEdit && (
                    <Button onClick={() => setIsEditingFinal(true)}>
                      Edit
                    </Button>
                  )}
                  {canEdit && (
                    <Button variant="outline" onClick={handleAddRow}>
                      Add test
                    </Button>
                  )}
                  {canDiscardDraft && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleDiscardDraft();
                        setNotice(null);
                        setIsEditingFinal(false);
                      }}
                    >
                      Discard draft
                    </Button>
                  )}
                  {canEdit && (
                    <Button onClick={handleCommit} disabled={!canCommit}>
                      {commitSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Review & confirm
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
