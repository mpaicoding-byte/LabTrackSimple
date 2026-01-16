"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { ReviewDraft, ReviewRow } from "./types";

type ReviewGridProps = {
  rows: ReviewRow[];
  drafts: Record<string, ReviewDraft>;
  savingRows: Record<string, boolean>;
  readOnly: boolean;
  onEdit: (rowId: string) => void;
  onDraftChange: (rowId: string, draft: Partial<ReviewDraft>) => void;
  onCancel: (rowId: string) => void;
  onSave: (rowId: string) => void;
};

export const ReviewGrid = ({
  rows,
  drafts,
  savingRows,
  readOnly,
  onEdit,
  onDraftChange,
  onCancel,
  onSave,
}: ReviewGridProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white/80">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Numeric</th>
              <th className="px-4 py-3 font-medium">Details</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {rows.map((row) => {
              const draft = drafts[row.id];
              const isEditing = Boolean(draft);
              const isSaving = Boolean(savingRows[row.id]);
              const isEdited = Boolean(row.edited_at);

              return (
                <tr key={row.id} className="align-top">
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Input
                        aria-label="Name"
                        value={draft.name_raw}
                        onChange={(event) =>
                          onDraftChange(row.id, { name_raw: event.target.value })
                        }
                      />
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-900">{row.name_raw}</span>
                        {isEdited && (
                          <span className="text-xs font-medium text-indigo-500">
                            Edited
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Input
                        aria-label="Value"
                        value={draft.value_raw}
                        onChange={(event) =>
                          onDraftChange(row.id, { value_raw: event.target.value })
                        }
                      />
                    ) : (
                      <span className="text-zinc-700">{row.value_raw}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Input
                        aria-label="Unit"
                        value={draft.unit_raw}
                        onChange={(event) =>
                          onDraftChange(row.id, { unit_raw: event.target.value })
                        }
                      />
                    ) : (
                      <span className="text-zinc-700">{row.unit_raw ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Input
                        aria-label="Numeric value"
                        inputMode="decimal"
                        value={draft.value_num}
                        onChange={(event) =>
                          onDraftChange(row.id, { value_num: event.target.value })
                        }
                      />
                    ) : (
                      <span className="text-zinc-700">
                        {row.value_num ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Input
                        aria-label="Details"
                        value={draft.details_raw}
                        onChange={(event) =>
                          onDraftChange(row.id, { details_raw: event.target.value })
                        }
                      />
                    ) : (
                      <span className="text-zinc-600">{row.details_raw ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {readOnly ? (
                        <span className="text-xs text-zinc-400">Owner only</span>
                      ) : isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => onSave(row.id)}
                            disabled={isSaving}
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancel(row.id)}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(row.id)}
                          >
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
