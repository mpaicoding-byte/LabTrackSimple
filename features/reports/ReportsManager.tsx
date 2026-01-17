"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, FileText, Calendar, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { FileDropzone } from "./components/FileDropzone";

type PersonRow = {
  id: string;
  name: string;
};

type ReportRow = {
  id: string;
  person_id: string;
  report_date: string;
  source: string | null;
  status: "draft" | "review_required" | "final" | "extraction_failed";
  created_at: string;
};

type ReportNotice = {
  tone: "success" | "error";
  message: string;
};

// Helper for random IDs
const buildArtifactId = () => crypto.randomUUID();
const BUCKET_ID = "lab-artifacts";
const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
};

const wrapWithBoundary = (content: React.ReactNode) => (
  <ErrorBoundary>{content}</ErrorBoundary>
);

export const ReportsManager = () => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { session, loading: sessionLoading } = useSession();
  const router = useRouter();

  // Data State
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractingReports, setExtractingReports] = useState<Record<string, boolean>>({});
  const [reportNotices, setReportNotices] = useState<Record<string, ReportNotice>>({});
  const [reportToDelete, setReportToDelete] = useState<ReportRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  // Draft Form State
  const [draftPersonId, setDraftPersonId] = useState("");
  const [draftDate, setDraftDate] = useState("");

  // Computed
  const peopleById = useMemo(
    () => new Map(people.map((person) => [person.id, person.name])),
    [people],
  );

  const updateReportStatus = useCallback(
    (reportId: string, status: ReportRow["status"]) => {
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId ? { ...report, status } : report,
        ),
      );
    },
    [],
  );

  const setReportNotice = useCallback((reportId: string, notice: ReportNotice) => {
    setReportNotices((prev) => ({ ...prev, [reportId]: notice }));
  }, []);

  // --- Data Loading ---
  const loadInitialData = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);

    try {
      // 1. Get Household
      const { data: memberData } = await supabase
        .from("household_members")
        .select("household_id, role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!memberData) {
        setLoading(false);
        return;
      }

      setHouseholdId(memberData.household_id);
      setRole(memberData.role);

      // 2. Load People
      const { data: peopleData } = await supabase
        .from("people")
        .select("id, name")
        .eq("household_id", memberData.household_id)
        .is("deleted_at", null);

      setPeople(peopleData ?? []);

      // 3. Load Reports
      const { data: reportData } = await supabase
        .from("lab_reports")
        .select("*")
        .eq("household_id", memberData.household_id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      setReports(reportData as ReportRow[] ?? []);

    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  }, [session, supabase]);

  useEffect(() => {
    if (!sessionLoading) loadInitialData();
  }, [sessionLoading, loadInitialData]);

  // Safety Timeout: Force stop loading after 5 seconds to prevent infinite spinner
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading((current) => {
        if (current) {
          console.warn("Force stopping loading after timeout");
          return false;
        }
        return current;
      });
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // --- Actions ---

  const handleFileSelect = (file: File) => {
    setDraftFile(file);
    setDraftError(null);
    // Pre-fill date with today if empty
    if (!draftDate) {
      setDraftDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleCancelDraft = () => {
    setDraftFile(null);
    setDraftPersonId("");
    setDraftDate("");
    setDraftError(null);
  };

  const handleSaveDraft = async () => {
    if (!draftFile || !householdId || !draftPersonId || !draftDate) return;

    const fileToUpload = draftFile;
    const reportPersonId = draftPersonId;
    const reportDate = draftDate;

    setIsUploading(true);
    setDraftError(null);
    let reportId: string | null = null;
    try {
      // 1. Create Report first
      const { data: report, error: reportError } = await supabase
        .from("lab_reports")
        .insert({
          household_id: householdId,
          person_id: reportPersonId,
          report_date: reportDate,
          source: "Uploaded via Web",
          status: "draft"
        })
        .select()
        .single();

      if (reportError) throw reportError;
      reportId = report.id;

      // 2. Prepare artifact metadata
      const artifactId = buildArtifactId();
      const fileExt = fileToUpload.name.split('.').pop() || 'bin';
      const objectPath = `${householdId}/${report.id}/${artifactId}.${fileExt}`;

      setReports(prev => [report as ReportRow, ...prev]);
      setReportNotice(report.id, {
        tone: "success",
        message: "Uploading report...",
      });
      handleCancelDraft();
      router.replace("/reports");

      // 3. Create Artifact Record FIRST (required by storage RLS policy)
      // Status is "pending" until upload completes
      const { error: artifactError } = await supabase
        .from("lab_artifacts")
        .insert({
          id: artifactId,
          household_id: householdId,
          lab_report_id: report.id,
          object_path: objectPath,
          kind: draftFile.type === "application/pdf" ? "pdf" : "image",
          mime_type: draftFile.type,
          status: "pending"
        });

      if (artifactError) throw artifactError;

      // 4. NOW upload the file (RLS policy can find the artifact record)
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_ID)
        .upload(objectPath, fileToUpload);

      if (uploadError) {
        // If upload fails, clean up the artifact record
        await supabase.from("lab_artifacts").delete().eq("id", artifactId);
        throw uploadError;
      }

      // 5. Update artifact status to ready
      await supabase
        .from("lab_artifacts")
        .update({ status: "ready" })
        .eq("id", artifactId);

      setReportNotice(report.id, {
        tone: "success",
        message: "Upload complete. Running extraction...",
      });
      void handleExtractReport(report.id);

    } catch (e) {
      console.error("Upload failed", e);
      if (reportId) {
        const message = resolveErrorMessage(e, "Upload failed.");
        setReportNotice(reportId, { tone: "error", message });
      } else {
        const message = resolveErrorMessage(e, "Upload failed.");
        setDraftError(message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleExtractReport = useCallback(
    async (reportId: string) => {
      setExtractingReports((prev) => ({ ...prev, [reportId]: true }));
      try {
        const { data, error } = await supabase.functions.invoke("extract_report", {
          body: { lab_report_id: reportId },
        });

        if (error) {
          updateReportStatus(reportId, "extraction_failed");
          setReportNotice(reportId, {
            tone: "error",
            message: error.message ?? "Extraction failed.",
          });
          return;
        }

        const status =
          data?.status === "extraction_failed" ? "extraction_failed" : "review_required";

        updateReportStatus(reportId, status);
        setReportNotice(reportId, {
          tone: "success",
          message: `Extraction complete (${data?.inserted_rows ?? 0} rows).`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Extraction failed.";
        updateReportStatus(reportId, "extraction_failed");
        setReportNotice(reportId, {
          tone: "error",
          message,
        });
      } finally {
        setExtractingReports((prev) => ({ ...prev, [reportId]: false }));
      }
    },
    [supabase, setReportNotice, updateReportStatus],
  );

  const handleDeleteReport = useCallback(
    async () => {
      if (!reportToDelete) return;
      setDeletingReportId(reportToDelete.id);
      setDeleteError(null);

      const { error } = await supabase.rpc("soft_delete_report", {
        target_report_id: reportToDelete.id,
      });

      if (error) {
        const message = error.message ?? "Failed to delete report.";
        setDeleteError(message);
        setReportNotice(reportToDelete.id, {
          tone: "error",
          message,
        });
        setDeletingReportId(null);
        return;
      }

      setReports((prev) => prev.filter((report) => report.id !== reportToDelete.id));
      setExtractingReports((prev) => {
        if (!prev[reportToDelete.id]) return prev;
        const next = { ...prev };
        delete next[reportToDelete.id];
        return next;
      });
      setReportNotices((prev) => {
        if (!prev[reportToDelete.id]) return prev;
        const next = { ...prev };
        delete next[reportToDelete.id];
        return next;
      });
      setDeletingReportId(null);
      setReportToDelete(null);
    },
    [reportToDelete, setReportNotice, supabase],
  );

  // --- Render Views ---

  // Login Gate
  if (!sessionLoading && !session) {
    return wrapWithBoundary(
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="bg-indigo-50 p-4 rounded-full">
            <User className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold">Please Sign In</h2>
          <p className="text-slate-500 max-w-sm text-center">You need to be signed in to view reports and artifacts.</p>
          <Button asChild>
            <a href="/auth">Go to Sign In</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return wrapWithBoundary(
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-zinc-300" />
        </div>
      </DashboardLayout>
    );
  }

  // View: Draft Mode (Overlay)
  if (draftFile) {
    return wrapWithBoundary(
      <DashboardLayout>
        <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <header className="mb-8">
            <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white mb-2">New Report from File</h1>
            <p className="text-zinc-500 dark:text-zinc-400">{draftFile.name} ({Math.round(draftFile.size / 1024)} KB)</p>
          </header>

          <div className="grid gap-8">
            <Card className="bg-white/80 dark:bg-white/5 border-zinc-200 dark:border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-zinc-900 dark:text-white">Report Details</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">Who is this report for?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Person</label>
                  <div className="flex flex-wrap gap-2">
                    {people.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setDraftPersonId(p.id)}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all duration-300 ${draftPersonId === p.id
                          ? "border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shadow-lg shadow-indigo-500/10"
                          : "border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white"
                          }`}
                      >
                        <User className="h-4 w-4" />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label htmlFor="report-date" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Report date</label>
                  <Input
                    id="report-date"
                    aria-label="Report date"
                    type="date"
                    value={draftDate}
                    onChange={(e) => setDraftDate(e.target.value)}
                    className="bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 h-12 rounded-xl"
                  />
                </div>

                {draftError && (
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    {draftError}
                  </p>
                )}

                <div className="pt-4 flex gap-3">
                  <Button
                    onClick={handleSaveDraft}
                    disabled={isUploading || !draftPersonId || !draftDate}
                    className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  >
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Report
                  </Button>
                  <Button variant="ghost" onClick={handleCancelDraft} disabled={isUploading} className="h-12 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // View: Dashboard List
  return wrapWithBoundary(
    <DashboardLayout>
      <div className="flex flex-col gap-8 relative z-10">

        {/* Header Area */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white mb-2">Lab Reports</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">Review and organize your medical history.</p>
          </div>
        </div>

        {/* Action: Dropzone */}
        {role === "owner" && (
          <div className="group relative rounded-3xl border-2 border-dashed border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
            <FileDropzone onFileSelect={handleFileSelect} />
          </div>
        )}

        {/* List */}
        <div className="grid gap-4">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-zinc-200 dark:border-white/5 bg-white/40 dark:bg-white/[0.02]">
              <div className="h-16 w-16 bg-zinc-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-zinc-400 dark:text-zinc-600">
                <FileText className="h-8 w-8" />
              </div>
              <p className="text-zinc-500 font-medium">No reports found.</p>
              <p className="text-sm text-zinc-600 mt-1">Upload your first report above to start reviewing results.</p>
            </div>
          ) : (
            reports.map((report) => {
              const notice = reportNotices[report.id];
              const isExtracting = Boolean(extractingReports[report.id]);
              const statusLabel =
                report.status === "review_required"
                  ? "review required"
                  : report.status === "final"
                    ? "final"
                    : report.status === "extraction_failed"
                      ? "extraction failed"
                      : "draft";

              return (
                <Card key={report.id} className="group overflow-hidden bg-white/80 dark:bg-white/5 border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:border-indigo-200 dark:hover:border-white/20 hover:scale-[1.01] transition-all duration-300 backdrop-blur-md shadow-sm dark:shadow-none">
                  <div className="flex flex-wrap items-center gap-5 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 dark:from-indigo-500/20 to-purple-500/10 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-white/5 shadow-inner">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {peopleById.get(report.person_id) ?? "Unknown"}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-zinc-500 mt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(report.report_date).toLocaleDateString()}
                        </div>
                        {report.source && <span className="w-1 h-1 bg-zinc-700 rounded-full" />}
                        {report.source && <span>{report.source}</span>}
                      </div>
                      {notice && (
                        <p
                          className={`mt-2 text-xs ${notice.tone === "error"
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                            }`}
                        >
                          {notice.message}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {role === "owner" && report.status === "extraction_failed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExtractReport(report.id)}
                          disabled={isExtracting}
                          className="border-indigo-200 dark:border-white/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-white/10"
                        >
                          {isExtracting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Retry extraction
                        </Button>
                      )}
                      {role === "owner" && report.status === "review_required" && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-amber-200 text-amber-600 hover:bg-amber-50"
                        >
                          <a href={`/reports/${report.id}/review`}>Review</a>
                        </Button>
                      )}
                      {report.status === "final" && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        >
                          <a href={`/reports/${report.id}/review`}>View</a>
                        </Button>
                      )}
                      {role === "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReportToDelete(report);
                            setDeleteError(null);
                          }}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          Delete
                        </Button>
                      )}
                      <Badge className={`
                        h-8 px-3 rounded-lg text-sm font-medium border-0
                        ${report.status === 'final' ? 'bg-emerald-500/10 text-emerald-400' :
                          report.status === 'review_required' ? 'bg-amber-500/10 text-amber-400' :
                            report.status === 'extraction_failed' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-500/10 text-zinc-400'
                        }
                      `}>
                        {statusLabel}
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

      </div>
      {reportToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => {
            if (!deletingReportId) {
              setReportToDelete(null);
              setDeleteError(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-report-title"
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-report-title" className="text-xl font-semibold text-zinc-900">
              Delete report?
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              This hides the report and its results. You can restore it later when cleanup tooling exists.
            </p>
            {deleteError && (
              <p className="mt-3 text-sm text-rose-600">
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setReportToDelete(null);
                  setDeleteError(null);
                }}
                disabled={deletingReportId === reportToDelete.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteReport}
                disabled={deletingReportId === reportToDelete.id}
              >
                {deletingReportId === reportToDelete.id ? "Deleting..." : "Delete report"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
