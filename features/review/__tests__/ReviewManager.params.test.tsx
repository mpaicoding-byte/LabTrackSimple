"use client";

import { render } from "@testing-library/react";
import { vi } from "vitest";

import { ReviewManager } from "../ReviewManager";
import { useReviewData } from "../useReviewData";

vi.mock("next/navigation", () => ({
  useParams: () => ({ reportId: "report-123" }),
}));

vi.mock("@/components/layout/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../useReviewData", () => ({
  useReviewData: vi.fn(() => ({
    supabase: {},
    session: { user: { id: "user-1" } },
    sessionLoading: false,
    role: "owner",
    report: null,
    setReport: vi.fn(),
    personName: null,
    runId: null,
    rows: [],
    setRows: vi.fn(),
    loading: false,
    error: null,
    previewUrl: null,
    previewKind: null,
    reload: vi.fn(),
  })),
}));

const useReviewActionsMock = vi.fn(() => ({
  drafts: {},
  savingRows: {},
  commitSaving: false,
  hasDirty: false,
  handleEdit: vi.fn(),
  handleDraftChange: vi.fn(),
  handleCancel: vi.fn(),
  handleSave: vi.fn(),
  handleCommit: vi.fn(),
  handleNotCorrect: vi.fn(),
}));

vi.mock("../useReviewActions", () => ({
  useReviewActions: (...args: Parameters<typeof useReviewActionsMock>) =>
    useReviewActionsMock(...args),
}));

test("falls back to route param when reportId prop is missing", () => {
  render(<ReviewManager reportId={undefined as unknown as string} />);

  const useReviewDataMock = vi.mocked(useReviewData);
  expect(useReviewDataMock).toHaveBeenCalledWith("report-123");
  expect(useReviewActionsMock).toHaveBeenCalledWith(
    expect.objectContaining({ reportId: "report-123" }),
  );
});
