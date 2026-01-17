"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const canDelete = role === "owner" && Boolean(report?.id);

  const handleDeleteReport = useCallback(async () => {
    if (!resolvedReportId) return;
    setIsDeleting(true);
    setDeleteError(null);

    const { error } = await supabase.rpc("soft_delete_report", {
      target_report_id: resolvedReportId,
    });

    if (error) {
      setDeleteError(error.message ?? "Failed to delete report.");
      setIsDeleting(false);
      return;
    }

    router.push("/reports");
  }, [resolvedReportId, router, supabase]);

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
          canDelete={canDelete}
          deleteDisabled={isDeleting}
          onDelete={() => {
            setDeleteOpen(true);
            setDeleteError(null);
          }}
        />

        <div className="grid gap-6">
          <Card>
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
                <p className="text-sm text-muted-foreground">No results yet.</p>
              ) : null}
              {hasDirty && canEdit && (
                <p className="text-xs text-muted-foreground">
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
                <p className="text-xs text-muted-foreground">
                  Tip: Add missing tests only if they appear in this uploaded report.
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
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
        {deleteOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="presentation"
            onClick={() => {
              if (!isDeleting) {
                setDeleteOpen(false);
                setDeleteError(null);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-report-title"
              className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="delete-report-title" className="text-xl font-semibold text-foreground">
                Delete report?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This hides the report and its results. You can restore it later when cleanup tooling exists.
              </p>
              {deleteError && (
                <p className="mt-3 text-sm text-destructive">
                  {deleteError}
                </p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteReport}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete report"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
