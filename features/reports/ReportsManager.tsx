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
import { LoadingState } from "@/components/ui/loading-state";
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

  // --- Render Views ---

  // Login Gate
  if (!sessionLoading && !session) {
    return wrapWithBoundary(
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="bg-muted p-4 rounded-full">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Please Sign In</h2>
          <p className="text-muted-foreground max-w-sm text-center">
            You need to be signed in to view reports and artifacts.
          </p>
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
          <LoadingState />
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
            <h1 className="text-3xl font-bold text-foreground mb-2">New Report from File</h1>
            <p className="text-muted-foreground">
              {draftFile.name} ({Math.round(draftFile.size / 1024)} KB)
            </p>
          </header>

          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Report Details</CardTitle>
                <CardDescription>Who is this report for?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Person</label>
                  <div className="flex flex-wrap gap-2">
                    {people.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setDraftPersonId(p.id)}
                        className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors ${
                          draftPersonId === p.id
                            ? "border-ring bg-muted text-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        <User className="h-4 w-4" />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label htmlFor="report-date" className="text-sm font-medium">Report date</label>
                  <Input
                    id="report-date"
                    aria-label="Report date"
                    type="date"
                    value={draftDate}
                    onChange={(e) => setDraftDate(e.target.value)}
                  />
                </div>

                {draftError && (
                  <p className="text-sm text-destructive">{draftError}</p>
                )}

                <div className="pt-4 flex gap-3">
                  <Button
                    size="lg"
                    onClick={handleSaveDraft}
                    disabled={isUploading || !draftPersonId || !draftDate}
                    className="w-full"
                  >
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Report
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={handleCancelDraft}
                    disabled={isUploading}
                  >
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Lab Reports</h1>
            <p className="text-muted-foreground text-lg">Review and organize your medical history.</p>
          </div>
        </div>

        {/* Action: Dropzone */}
        {role === "owner" && (
          <div className="group relative rounded-2xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:bg-muted/50">
            <FileDropzone onFileSelect={handleFileSelect} />
          </div>
        )}

        {/* List */}
        <div className="grid gap-4">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-border bg-muted/30">
              <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-4 text-muted-foreground">
                <FileText className="h-8 w-8" />
              </div>
              <p className="text-muted-foreground font-medium">No reports found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your first report above to start reviewing results.
              </p>
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
                <Card key={report.id} className="group overflow-hidden">
                  <div className="flex flex-wrap items-center gap-5 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground border border-border">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground text-lg">
                        {peopleById.get(report.person_id) ?? "Unknown"}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(report.report_date).toLocaleDateString()}
                        </div>
                        {report.source && <span className="w-1 h-1 bg-muted-foreground rounded-full" />}
                        {report.source && <span>{report.source}</span>}
                      </div>
                      {notice && (
                        <p
                          className={`mt-2 text-xs ${
                            notice.tone === "error"
                              ? "text-destructive"
                              : "text-primary"
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
                        >
                          <a href={`/reports/${report.id}/review`}>Review</a>
                        </Button>
                      )}
                      {report.status === "final" && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={`/reports/${report.id}/review`}>View</a>
                        </Button>
                      )}
                      <Badge
                        variant={
                          report.status === "extraction_failed"
                            ? "destructive"
                            : report.status === "final"
                              ? "secondary"
                              : report.status === "review_required"
                                ? "outline"
                                : "secondary"
                        }
                      >
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
    </DashboardLayout>
  );
};
