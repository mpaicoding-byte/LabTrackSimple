"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { ReviewDraft, ReviewRow } from "./types";

type ReviewGridProps = {
  rows: ReviewRow[];
  drafts: Record<string, ReviewDraft>;
  newRows: Array<{ id: string; draft: ReviewDraft }>;
  readOnly: boolean;
  onExistingDraftChange: (rowId: string, draft: Partial<ReviewDraft>) => void;
  onNewRowChange: (rowId: string, draft: Partial<ReviewDraft>) => void;
  onRemoveNewRow: (rowId: string) => void;
};

export const ReviewGrid = ({
  rows,
  drafts,
  newRows,
  readOnly,
  onExistingDraftChange,
  onNewRowChange,
  onRemoveNewRow,
}: ReviewGridProps) => {
  const renderEditableRow = (
    rowId: string,
    values: {
      name_raw: string;
      value_raw: string;
      unit_raw: string;
      value_num: string;
      details_raw: string;
    },
    {
      isEdited = false,
      removable = false,
    }: { isEdited?: boolean; removable?: boolean } = {},
  ) => (
    <tr key={rowId} className="align-top">
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <Input
            aria-label="Name"
            value={values.name_raw}
            onChange={(event) =>
              removable
                ? onNewRowChange(rowId, { name_raw: event.target.value })
                : onExistingDraftChange(rowId, { name_raw: event.target.value })
            }
          />
          {isEdited && (
            <span className="text-xs font-medium text-primary">Edited</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Input
          aria-label="Value"
          value={values.value_raw}
          onChange={(event) =>
            removable
              ? onNewRowChange(rowId, { value_raw: event.target.value })
              : onExistingDraftChange(rowId, { value_raw: event.target.value })
          }
        />
      </td>
      <td className="px-4 py-3">
        <Input
          aria-label="Unit"
          value={values.unit_raw}
          onChange={(event) =>
            removable
              ? onNewRowChange(rowId, { unit_raw: event.target.value })
              : onExistingDraftChange(rowId, { unit_raw: event.target.value })
          }
        />
      </td>
      <td className="px-4 py-3">
        <Input
          aria-label="Numeric value"
          inputMode="decimal"
          value={values.value_num}
          onChange={(event) =>
            removable
              ? onNewRowChange(rowId, { value_num: event.target.value })
              : onExistingDraftChange(rowId, { value_num: event.target.value })
          }
        />
      </td>
      <td className="px-4 py-3">
        <Input
          aria-label="Details"
          value={values.details_raw}
          onChange={(event) =>
            removable
              ? onNewRowChange(rowId, { details_raw: event.target.value })
              : onExistingDraftChange(rowId, { details_raw: event.target.value })
          }
        />
      </td>
      <td className="px-4 py-3">
        {removable ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveNewRow(rowId)}
          >
            Remove
          </Button>
        ) : null}
      </td>
    </tr>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Numeric</th>
              <th className="px-4 py-3 font-medium">Details</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {readOnly
              ? rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-foreground">{row.name_raw}</span>
                        {row.edited_at && (
                          <span className="text-xs font-medium text-primary">
                            Edited
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-foreground">{row.value_raw}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-foreground">{row.unit_raw ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-foreground">{row.value_num ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">{row.details_raw ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">Owner only</span>
                    </td>
                  </tr>
                ))
              : rows.map((row) =>
                  renderEditableRow(
                    row.id,
                    {
                      name_raw: drafts[row.id]?.name_raw ?? row.name_raw,
                      value_raw: drafts[row.id]?.value_raw ?? row.value_raw,
                      unit_raw: drafts[row.id]?.unit_raw ?? row.unit_raw ?? "",
                      value_num:
                        drafts[row.id]?.value_num ??
                        (row.value_num === null ? "" : String(row.value_num)),
                      details_raw:
                        drafts[row.id]?.details_raw ?? row.details_raw ?? "",
                    },
                    { isEdited: Boolean(row.edited_at) },
                  ),
                )}
            {!readOnly &&
              newRows.map((row) =>
                renderEditableRow(row.id, row.draft, { removable: true }),
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
