"use client";

import { ArrowLeft, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";

type Notice = {
  tone: "success" | "error";
  message: string;
};

export const ReviewSignInGate = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <div className="bg-muted p-4 rounded-full">
      <FileText className="w-8 h-8 text-muted-foreground" />
    </div>
    <h2 className="text-xl font-semibold">Please Sign In</h2>
    <p className="text-muted-foreground max-w-sm text-center">
      You need to be signed in to review results.
    </p>
    <Button asChild>
      <a href="/auth">Go to Sign In</a>
    </Button>
  </div>
);

export const ReviewLoadingState = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <LoadingState />
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
        <CardDescription>No results to review yet.</CardDescription>
      </CardHeader>
    </Card>
  </div>
);

export const ReviewHeader = ({
  personName,
  reportDate,
  notice,
  previewUrl,
  canDelete = false,
  deleteDisabled = false,
  onDelete,
}: {
  personName: string | null;
  reportDate: string | null;
  notice: Notice | null;
  previewUrl: string | null;
  canDelete?: boolean;
  deleteDisabled?: boolean;
  onDelete?: () => void;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold text-foreground">
        Review Results
      </h1>
      <p className="text-muted-foreground">
        {personName ? `${personName} · ` : ""}
        {reportDate ? new Date(reportDate).toLocaleDateString() : ""}
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      {notice && (
        <span
          className={`text-sm ${
            notice.tone === "error" ? "text-destructive" : "text-primary"
          }`}
        >
          {notice.message}
        </span>
      )}
      {canDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={deleteDisabled}
        >
          Delete report
        </Button>
      )}
      {previewUrl && (
        <Button variant="outline" size="sm" asChild>
          <a href={previewUrl} target="_blank" rel="noreferrer">
            Preview document
          </a>
        </Button>
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
