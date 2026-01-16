"use client";

import { ArrowLeft, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Notice = {
  tone: "success" | "error";
  message: string;
};

type PreviewKind = "pdf" | "image" | null;

export const ReviewSignInGate = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <div className="bg-indigo-50 p-4 rounded-full">
      <FileText className="w-8 h-8 text-indigo-600" />
    </div>
    <h2 className="text-xl font-semibold">Please Sign In</h2>
    <p className="text-zinc-500 max-w-sm text-center">
      You need to be signed in to review results.
    </p>
    <Button asChild>
      <a href="/auth">Go to Sign In</a>
    </Button>
  </div>
);

export const ReviewLoadingState = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
  </div>
);

export const ReviewErrorState = ({ error }: { error: string }) => (
  <Card className="max-w-2xl">
    <CardHeader>
      <CardTitle>Review Results</CardTitle>
      <CardDescription>{error}</CardDescription>
    </CardHeader>
  </Card>
);

export const ReviewEmptyState = () => (
  <div className="flex flex-col gap-6">
    <Button variant="ghost" size="sm" asChild className="w-fit">
      <a href="/reports" className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to reports
      </a>
    </Button>
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Review Results</CardTitle>
        <CardDescription>No results to confirm yet.</CardDescription>
      </CardHeader>
    </Card>
  </div>
);

export const ReviewHeader = ({
  personName,
  reportDate,
  notice,
}: {
  personName: string | null;
  reportDate: string | null;
  notice: Notice | null;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 className="text-3xl font-display font-bold text-zinc-900">
        Review Results
      </h1>
      <p className="text-zinc-500">
        {personName ? `${personName} · ` : ""}
        {reportDate ? new Date(reportDate).toLocaleDateString() : ""}
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      {notice && (
        <span
          className={`text-sm ${
            notice.tone === "error" ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {notice.message}
        </span>
      )}
      <Button variant="ghost" size="sm" asChild>
        <a href="/reports" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to reports
        </a>
      </Button>
    </div>
  </div>
);

export const ReviewPreviewCard = ({
  previewUrl,
  previewKind,
}: {
  previewUrl: string | null;
  previewKind: PreviewKind;
}) => (
  <Card className="border-zinc-200">
    <CardHeader>
      <CardTitle>Artifact preview</CardTitle>
      <CardDescription>Cross-check values with the original document.</CardDescription>
    </CardHeader>
    <CardContent>
      {previewUrl ? (
        previewKind === "pdf" ? (
          <iframe
            title="Artifact preview"
            src={previewUrl}
            className="h-[420px] w-full rounded-xl border"
          />
        ) : (
          <img
            src={previewUrl}
            alt="Artifact preview"
            className="h-[420px] w-full rounded-xl border object-cover"
          />
        )
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-sm text-zinc-500">
          <FileText className="h-6 w-6" />
          No artifact available for preview.
        </div>
      )}
    </CardContent>
  </Card>
);
