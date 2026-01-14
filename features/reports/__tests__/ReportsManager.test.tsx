"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ReportsManager } from "../ReportsManager";

vi.mock("next/navigation", () => ({
  usePathname: () => "/reports",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
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

const insertStagingMock = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
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

    if (table === "lab_results_staging") {
      return {
        insert: insertStagingMock,
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

test("owners can save a report from a file and upload its artifact", async () => {
  vi.stubGlobal("crypto", {
    randomUUID: () => "artifact-123",
  });

  render(<ReportsManager />);

  const fileInput = await screen.findByLabelText(/report file/i);
  const file = new File(["dummy"], "report.pdf", {
    type: "application/pdf",
  });

  await userEvent.upload(fileInput, file);
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

  vi.unstubAllGlobals();
});

test("owners can trigger extraction for a report", async () => {
  reportsData = [
    {
      id: "report-1",
      person_id: "person-1",
      report_date: "2024-01-10",
      source: "Quest",
      status: "draft",
      created_at: "2024-01-10T12:00:00Z",
    },
  ];

  render(<ReportsManager />);

  const extractButton = await screen.findByRole("button", {
    name: /extract/i,
  });
  await userEvent.click(extractButton);

  await waitFor(() => {
    expect(invokeMock).toHaveBeenCalledWith("extract_report", {
      body: { lab_report_id: "report-1" },
    });
  });

  await screen.findByText(/review required/i);
});

test("owners can add a manual staging row", async () => {
  reportsData = [
    {
      id: "report-1",
      person_id: "person-1",
      report_date: "2024-01-10",
      source: "Quest",
      status: "draft",
      created_at: "2024-01-10T12:00:00Z",
    },
  ];

  vi.stubGlobal("crypto", {
    randomUUID: () => "run-123",
  });

  render(<ReportsManager />);

  await userEvent.type(
    await screen.findByLabelText(/result name/i),
    "Glucose",
  );
  await userEvent.type(
    screen.getByLabelText(/result value/i),
    "92",
  );
  await userEvent.type(
    screen.getByLabelText(/result unit/i),
    "mg\/dL",
  );
  await userEvent.type(
    screen.getByLabelText(/result details/i),
    "fasting",
  );

  await userEvent.click(
    screen.getByRole("button", { name: /add result/i }),
  );

  await waitFor(() => {
    expect(insertStagingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        lab_report_id: "report-1",
        extraction_run_id: "run-123",
        name_raw: "Glucose",
        value_raw: "92",
        unit_raw: "mg/dL",
        value_num: 92,
        details_raw: "fasting",
      }),
    );
  });

  await screen.findByText(/review required/i);

  vi.unstubAllGlobals();
});
