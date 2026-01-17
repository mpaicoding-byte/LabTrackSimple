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

const buildEmptyDraft = (): ReviewDraft => ({
  name_raw: "",
  value_raw: "",
  unit_raw: "",
  value_num: "",
  details_raw: "",
});

const buildClientRowId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;

type UseReviewActionsParams = {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  reportId?: string;
  personId: string | null;
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
  personId,
  runId,
  rows,
  setRows,
  setNotice,
  onCommitSuccess,
}: UseReviewActionsParams) => {
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [newRows, setNewRows] = useState<Array<{ id: string; draft: ReviewDraft }>>(
    [],
  );
  const [commitSaving, setCommitSaving] = useState(false);

  const hasDirty = useMemo(
    () => Object.keys(drafts).length > 0 || newRows.length > 0,
    [drafts, newRows],
  );

  const handleExistingDraftChange = (rowId: string, update: Partial<ReviewDraft>) => {
    const row = rows.find((item) => item.id === rowId);
    const base = drafts[rowId] ?? (row ? buildDraftFromRow(row) : buildEmptyDraft());

    setDrafts((prev) => ({
      ...prev,
      [rowId]: { ...base, ...update },
    }));
  };

  const handleAddRow = () => {
    setNewRows((prev) => [...prev, { id: buildClientRowId(), draft: buildEmptyDraft() }]);
  };

  const handleNewRowChange = (rowId: string, update: Partial<ReviewDraft>) => {
    setNewRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, draft: { ...row.draft, ...update } } : row,
      ),
    );
  };

  const handleRemoveNewRow = (rowId: string) => {
    setNewRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleDiscardDraft = () => {
    setDrafts({});
    setNewRows([]);
  };

  const handleCommit = async () => {
    if (!runId || !reportId) {
      setNotice({ tone: "error", message: "Missing report context." });
      return;
    }
    if (!personId) {
      setNotice({ tone: "error", message: "Missing person context." });
      return;
    }

    setCommitSaving(true);

    const timestamp = new Date().toISOString();

    const draftUpdates = Object.entries(drafts);
    for (const [rowId, draft] of draftUpdates) {
      if (!draft.name_raw.trim() || !draft.value_raw.trim()) {
        setNotice({ tone: "error", message: "Name and value are required." });
        setCommitSaving(false);
        return;
      }

      const valueNum =
        draft.value_num.trim() === "" ? null : parseValueNum(draft.value_num);

      const payload = {
        name_raw: draft.name_raw.trim(),
        value_raw: draft.value_raw.trim(),
        unit_raw: draft.unit_raw.trim() || null,
        value_num: valueNum,
        details_raw: draft.details_raw.trim() || null,
        edited_at: timestamp,
      } as const;

      const { error: updateError } = await supabase
        .from("lab_results")
        .update(payload)
        .eq("id", rowId);

      if (updateError) {
        setNotice({ tone: "error", message: updateError.message });
        setCommitSaving(false);
        return;
      }

      setRows((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, ...payload } : row)),
      );
    }

    if (draftUpdates.length > 0) {
      setDrafts({});
    }

    if (newRows.length > 0) {
      for (const row of newRows) {
        if (!row.draft.name_raw.trim() || !row.draft.value_raw.trim()) {
          setNotice({ tone: "error", message: "Name and value are required." });
          setCommitSaving(false);
          return;
        }
      }

      const payload = newRows.map((row) => {
        const valueNum =
          row.draft.value_num.trim() === ""
            ? null
            : parseValueNum(row.draft.value_num);
        return {
          lab_report_id: reportId,
          person_id: personId,
          extraction_run_id: runId,
          name_raw: row.draft.name_raw.trim(),
          value_raw: row.draft.value_raw.trim(),
          unit_raw: row.draft.unit_raw.trim() || null,
          value_num: valueNum,
          details_raw: row.draft.details_raw.trim() || null,
        };
      });

      const { data: insertedRows, error: insertError } = await supabase
        .from("lab_results")
        .insert(payload)
        .select("id, name_raw, value_raw, unit_raw, value_num, details_raw, edited_at");

      if (insertError) {
        setNotice({ tone: "error", message: insertError.message });
        setCommitSaving(false);
        return;
      }

      setRows((prev) => [...prev, ...((insertedRows ?? []) as ReviewRow[])]);
      setNewRows([]);
    }

    const { data, error: commitError } = await supabase.functions.invoke(
      "confirm_report_results",
      { body: { lab_report_id: reportId } },
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

  return {
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
  };
};
