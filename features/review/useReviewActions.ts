"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";

import type { ReviewDraft, ReviewRow } from "./types";

const parseValueNum = (valueRaw: string) => {
  const trimmed = valueRaw.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : null;
};

const buildDraftFromRow = (row: ReviewRow): ReviewDraft => ({
  name_raw: row.name_raw,
  value_raw: row.value_raw,
  unit_raw: row.unit_raw ?? "",
  value_num: row.value_num === null ? "" : String(row.value_num),
  details_raw: row.details_raw ?? "",
});

type UseReviewActionsParams = {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  reportId?: string;
  runId: string | null;
  rows: ReviewRow[];
  setRows: Dispatch<SetStateAction<ReviewRow[]>>;
  setNotice: Dispatch<
    SetStateAction<{ tone: "success" | "error"; message: string } | null>
  >;
  onCommitSuccess: () => void;
};

export const useReviewActions = ({
  supabase,
  reportId,
  runId,
  rows,
  setRows,
  setNotice,
  onCommitSuccess,
}: UseReviewActionsParams) => {
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [commitSaving, setCommitSaving] = useState(false);

  const hasDirty = useMemo(() => Object.keys(drafts).length > 0, [drafts]);

  const handleEdit = (rowId: string) => {
    const row = rows.find((item) => item.id === rowId);
    if (!row) return;

    setDrafts((prev) => ({ ...prev, [rowId]: buildDraftFromRow(row) }));
  };

  const handleDraftChange = (rowId: string, update: Partial<ReviewDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [rowId]: { ...prev[rowId], ...update },
    }));
  };

  const handleCancel = (rowId: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };

  const handleSave = async (rowId: string) => {
    const draft = drafts[rowId];
    if (!draft) return;

    if (!draft.name_raw.trim() || !draft.value_raw.trim()) {
      setNotice({ tone: "error", message: "Name and value are required." });
      return;
    }

    setSavingRows((prev) => ({ ...prev, [rowId]: true }));
    const valueNum =
      draft.value_num.trim() === "" ? null : parseValueNum(draft.value_num);

    const payload = {
      name_raw: draft.name_raw.trim(),
      value_raw: draft.value_raw.trim(),
      unit_raw: draft.unit_raw.trim() || null,
      value_num: valueNum,
      details_raw: draft.details_raw.trim() || null,
      edited_at: new Date().toISOString(),
    } as const;

    const { error: updateError } = await supabase
      .from("lab_results")
      .update(payload)
      .eq("id", rowId);

    if (updateError) {
      setNotice({ tone: "error", message: updateError.message });
    } else {
      setRows((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? { ...row, ...payload }
            : row,
        ),
      );
      handleCancel(rowId);
      setNotice({ tone: "success", message: "Row updated." });
    }

    setSavingRows((prev) => ({ ...prev, [rowId]: false }));
  };

  const handleCommit = async () => {
    if (!runId || !reportId) {
      setNotice({ tone: "error", message: "Missing report context." });
      return;
    }
    setCommitSaving(true);

    const { data, error: commitError } = await supabase.functions.invoke(
      "confirm_report_results",
      {
        body: { lab_report_id: reportId },
      },
    );

    if (commitError) {
      setNotice({ tone: "error", message: commitError.message });
    } else {
      setNotice({
        tone: "success",
        message: `Report confirmed (${data?.confirmed_rows ?? 0} rows).`,
      });
      onCommitSuccess();
    }

    setCommitSaving(false);
  };

  const handleNotCorrect = async () => {
    if (!runId || !reportId) {
      setNotice({ tone: "error", message: "Missing report context." });
      return;
    }

    setCommitSaving(true);
    const { error: runError } = await supabase
      .from("extraction_runs")
      .update({ status: "rejected" })
      .eq("id", runId);

    if (runError) {
      setNotice({ tone: "error", message: runError.message });
    } else {
      await supabase
        .from("lab_reports")
        .update({ status: "review_required" })
        .eq("id", reportId);
      setNotice({
        tone: "success",
        message: "Marked as not correct. You can retry extraction.",
      });
    }

    setCommitSaving(false);
  };

  return {
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
  };
};
