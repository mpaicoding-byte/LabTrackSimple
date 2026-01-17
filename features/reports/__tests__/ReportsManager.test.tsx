"use client";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ReportsManager } from "../ReportsManager";

const pushMock = vi.fn();
const replaceMock = vi.fn();
const prefetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/reports",
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    prefetch: prefetchMock,
  }),
}));

type PersonRow = {
  id: string;
  name: string;
};

type ReportRow = {
  id: string;
  person_id: string;
  report_date: string;
  source: string | null;
  status: string;
  created_at: string;
};

let peopleData: PersonRow[] = [];
let reportsData: ReportRow[] = [];

const insertReportMock = vi.fn((payload: unknown) => {
  const row = Array.isArray(payload) ? payload[0] : payload;
  return {
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        id: "report-1",
        status: "draft",
        created_at: "2024-01-01T00:00:00Z",
        ...(row as object),
      },
      error: null,
    }),
  };
});

const insertArtifactMock = vi.fn((_payload: unknown) => ({ error: null }));

const updateArtifactMock = vi.fn(() => ({
  eq: vi.fn().mockResolvedValue({ error: null }),
}));

const deleteArtifactMock = vi.fn(() => ({
  eq: vi.fn().mockResolvedValue({ error: null }),
}));

const updateReportMock = vi.fn(() => ({
  eq: vi.fn().mockResolvedValue({ error: null }),
}));

const rpcMock = vi.fn().mockResolvedValue({ data: true, error: null });

const insertRunMock = vi.fn((_payload: unknown) => ({
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: { id: "run-1", status: "ready" },
    error: null,
  }),
}));

const uploadMock = vi.fn().mockResolvedValue({
  data: { path: "mock-path" },
  error: null,
});

const invokeMock = vi.fn().mockResolvedValue({
  data: {
    extraction_run_id: "run-1",
    inserted_rows: 1,
    status: "review_required",
  },
  error: null,
});

const supabaseMock = {
  from: vi.fn((table: string) => {
    if (table === "household_members") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { household_id: "household-1", role: "owner" },
          error: null,
        }),
      };
    }

    if (table === "people") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ data: peopleData, error: null }),
        order: vi.fn().mockResolvedValue({ data: peopleData, error: null }),
      };
    }

    if (table === "lab_reports") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: reportsData, error: null }),
        insert: insertReportMock,
        update: updateReportMock,
      };
    }

    if (table === "lab_artifacts") {
      return {
        insert: insertArtifactMock,
        update: updateArtifactMock,
        delete: deleteArtifactMock,
      };
    }

    if (table === "extraction_runs") {
      return {
        insert: insertRunMock,
      };
    }

    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
  }),
  storage: {
    from: vi.fn(() => ({
      upload: uploadMock,
    })),
  },
  functions: {
    invoke: invokeMock,
  },
  rpc: rpcMock,
};

vi.mock("@/features/core/supabaseClient", () => ({
  getSupabaseBrowserClient: () => supabaseMock,
}));

const sessionMock = { user: { id: "user-1", email: "owner@example.com" } };
let sessionState: typeof sessionMock | null = sessionMock;

vi.mock("@/features/auth/SessionProvider", () => ({
  useSession: () => ({
    session: sessionState,
    loading: false,
    error: null,
  }),
}));

beforeEach(() => {
  sessionState = sessionMock;
  peopleData = [
    {
      id: "person-1",
      name: "Ada Lovelace",
    },
  ];
  reportsData = [];
  vi.clearAllMocks();
});

test("does not crash when the session becomes null", async () => {
  const { rerender } = render(<ReportsManager />);

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: /lab reports/i }),
    ).toBeInTheDocument();
  });

  sessionState = null;
  rerender(<ReportsManager />);

  await waitFor(() => {
    expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
  });
});

test("owners can save a report from a file, upload its artifact, and auto-extract", async () => {
  vi.stubGlobal("crypto", {
    randomUUID: () => "artifact-123",
  });

  render(<ReportsManager />);

  const fileInput = await screen.findByLabelText(/report file/i);
  const file = new File(["dummy"], "report.pdf", {
    type: "application/pdf",
  });

  await userEvent.upload(fileInput, file);
  await screen.findByRole("heading", { name: /new report from file/i });
  expect(screen.queryByText(/preview not available/i)).toBeNull();
  await userEvent.click(
    await screen.findByRole("button", { name: /ada lovelace/i }),
  );

  const dateInput = screen.getByLabelText(/report date/i);
  await userEvent.clear(dateInput);
  await userEvent.type(dateInput, "2024-01-10");

  await userEvent.click(
    screen.getByRole("button", { name: /save report/i }),
  );

  await waitFor(() => {
    expect(insertReportMock).toHaveBeenCalled();
  });

  expect(insertReportMock).toHaveBeenCalledWith(
    expect.objectContaining({
      household_id: "household-1",
      person_id: "person-1",
      report_date: "2024-01-10",
      source: "Uploaded via Web",
      status: "draft",
    }),
  );

  const artifactPayload = insertArtifactMock.mock.calls[0]?.[0];
  expect(artifactPayload).toEqual(
    expect.objectContaining({
      id: "artifact-123",
      lab_report_id: "report-1",
      household_id: "household-1",
      status: "pending",
      kind: "pdf",
      mime_type: "application/pdf",
      object_path: "household-1/report-1/artifact-123.pdf",
    }),
  );

  expect(uploadMock).toHaveBeenCalledWith(
    "household-1/report-1/artifact-123.pdf",
    file,
  );

  await waitFor(() => {
    expect(invokeMock).toHaveBeenCalledWith("extract_report", {
      body: { lab_report_id: "report-1" },
    });
  });

  await waitFor(() => {
    expect(replaceMock).toHaveBeenCalledWith("/reports");
  });

  vi.unstubAllGlobals();
});

test("shows an inline error when the report cannot be created", async () => {
  insertReportMock.mockImplementationOnce((payload: unknown) => {
    const row = Array.isArray(payload) ? payload[0] : payload;
    return {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...(row as object) },
        error: { message: "Insert failed" },
      }),
    };
  });

  render(<ReportsManager />);

  const fileInput = await screen.findByLabelText(/report file/i);
  const file = new File(["dummy"], "report.pdf", {
    type: "application/pdf",
  });

  await userEvent.upload(fileInput, file);
  await screen.findByRole("heading", { name: /new report from file/i });
  await userEvent.click(
    await screen.findByRole("button", { name: /ada lovelace/i }),
  );

  const dateInput = screen.getByLabelText(/report date/i);
  await userEvent.clear(dateInput);
  await userEvent.type(dateInput, "2024-01-10");

  await userEvent.click(
    screen.getByRole("button", { name: /save report/i }),
  );

  expect(await screen.findByText(/insert failed/i)).toBeInTheDocument();
});

test("owners can soft delete a report from the list", async () => {
  reportsData = [
    {
      id: "report-1",
      person_id: "person-1",
      report_date: "2024-02-01",
      source: "Uploaded via Web",
      status: "draft",
      created_at: "2024-02-01T00:00:00Z",
    },
  ];

  render(<ReportsManager />);

  const reportHeading = await screen.findByRole("heading", {
    name: /ada lovelace/i,
  });
  const reportCard = reportHeading.closest(".group");
  expect(reportCard).not.toBeNull();

  await userEvent.click(
    within(reportCard as HTMLElement).getByRole("button", { name: /delete/i }),
  );

  expect(await screen.findByRole("heading", { name: /delete report/i })).toBeVisible();
  await userEvent.click(
    screen.getByRole("button", { name: /delete report/i }),
  );

  await waitFor(() => {
    expect(rpcMock).toHaveBeenCalledWith("soft_delete_report", {
      target_report_id: "report-1",
    });
  });

  await waitFor(() => {
    expect(
      screen.queryByRole("heading", { name: /ada lovelace/i }),
    ).toBeNull();
  });

});

test("shows view for final reports and review for reports needing review", async () => {
  peopleData = [
    { id: "person-1", name: "Ada Lovelace" },
    { id: "person-2", name: "Grace Hopper" },
  ];
  reportsData = [
    {
      id: "report-final",
      person_id: "person-1",
      report_date: "2024-01-10",
      source: "Uploaded via Web",
      status: "final",
      created_at: "2024-01-10T00:00:00Z",
    },
    {
      id: "report-review",
      person_id: "person-2",
      report_date: "2024-02-01",
      source: "Uploaded via Web",
      status: "review_required",
      created_at: "2024-02-01T00:00:00Z",
    },
  ];

  render(<ReportsManager />);

  await screen.findByRole("heading", { name: /lab reports/i });
  expect(
    screen.queryByRole("button", { name: /create manual report/i }),
  ).toBeNull();

  const finalHeading = screen.getByRole("heading", { name: /ada lovelace/i });
  const finalCard = finalHeading.closest(".group");
  expect(finalCard).not.toBeNull();
  expect(
    within(finalCard as HTMLElement).getByRole("link", { name: /view/i }),
  ).toBeVisible();

  const reviewHeading = screen.getByRole("heading", { name: /grace hopper/i });
  const reviewCard = reviewHeading.closest(".group");
  expect(reviewCard).not.toBeNull();
  expect(
    within(reviewCard as HTMLElement).getByRole("link", { name: /review/i }),
  ).toBeVisible();
});
