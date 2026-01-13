"use client";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ReportsManager } from "../ReportsManager";

type PersonRow = {
  id: string;
  name: string;
  date_of_birth: string | null;
  gender: "female" | "male" | null;
};

type ReportRow = {
  id: string;
  person_id: string;
  report_date: string;
  source: string | null;
  notes: string | null;
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

const insertArtifactMock = vi.fn((payload: unknown) => {
  const row = Array.isArray(payload) ? payload[0] : payload;
  return {
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: row, error: null }),
  };
});

const updateArtifactMock = vi.fn(() => ({
  eq: vi.fn().mockResolvedValue({ error: null }),
}));

const uploadMock = vi.fn().mockResolvedValue({
  data: { path: "mock-path" },
  error: null,
});

const createSignedUrlMock = vi.fn().mockResolvedValue({
  data: { signedUrl: "https://example.com/mock" },
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
        is: vi.fn().mockReturnThis(),
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
      };
    }

    if (table === "lab_artifacts") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: insertArtifactMock,
        update: updateArtifactMock,
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
      createSignedUrl: createSignedUrlMock,
    })),
  },
};

vi.mock("@/features/core/supabaseClient", () => ({
  getSupabaseBrowserClient: () => supabaseMock,
}));

const sessionMock = { user: { id: "user-1", email: "owner@example.com" } };

vi.mock("@/features/auth/SessionProvider", () => ({
  useSession: () => ({
    session: sessionMock,
    loading: false,
    error: null,
  }),
}));

beforeEach(() => {
  peopleData = [
    {
      id: "person-1",
      name: "Ada Lovelace",
      date_of_birth: "1990-01-01",
      gender: "female",
    },
  ];
  reportsData = [];
  vi.clearAllMocks();
});

test("owners can create a report with person, date, source, and notes", async () => {
  render(<ReportsManager />);

  const personSelect = await screen.findByLabelText(/person/i);
  const dateInput = screen.getByLabelText(/report date/i);
  const sourceInput = screen.getByPlaceholderText(/lab source/i);
  const notesInput = screen.getByLabelText(/notes/i);
  const createButton = screen.getByRole("button", { name: /create report/i });

  expect(createButton).toBeDisabled();

  await within(personSelect).findByRole("option", { name: /ada lovelace/i });
  await userEvent.selectOptions(personSelect, "person-1");
  await userEvent.type(dateInput, "2024-01-10");
  await userEvent.type(sourceInput, "Quest Diagnostics");
  await userEvent.type(notesInput, "fasting");

  await waitFor(() => {
    expect(createButton).toBeEnabled();
  });

  await userEvent.click(createButton);

  await waitFor(() => {
    expect(insertReportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        household_id: "household-1",
        person_id: "person-1",
        report_date: "2024-01-10",
        source: "Quest Diagnostics",
        notes: "fasting",
      }),
    );
  });
});

test("artifact upload uses row-first insert and updates status", async () => {
  reportsData = [
    {
      id: "report-1",
      person_id: "person-1",
      report_date: "2024-01-10",
      source: "Quest",
      notes: null,
      status: "draft",
      created_at: "2024-01-10T12:00:00Z",
    },
  ];

  vi.stubGlobal("crypto", {
    randomUUID: () => "artifact-123",
  });

  render(<ReportsManager />);

  const reportSelect = await screen.findByLabelText(/^report$/i);
  await within(reportSelect).findByRole("option", { name: /ada lovelace/i });
  await userEvent.selectOptions(reportSelect, "report-1");

  const fileInput = screen.getByLabelText(/artifact file/i);
  const uploadButton = screen.getByRole("button", {
    name: /upload artifact/i,
  });

  const file = new File(["dummy"], "report.pdf", {
    type: "application/pdf",
  });

  await userEvent.upload(fileInput, file);
  await userEvent.click(uploadButton);

  await waitFor(() => {
    expect(insertArtifactMock).toHaveBeenCalled();
  });

  const insertPayload = insertArtifactMock.mock.calls[0]?.[0];
  const artifactRow = Array.isArray(insertPayload)
    ? insertPayload[0]
    : insertPayload;

  expect(artifactRow).toEqual(
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
    expect.objectContaining({ contentType: "application/pdf", upsert: false }),
  );

  expect(updateArtifactMock).toHaveBeenCalledWith(
    expect.objectContaining({ status: "ready" }),
  );

  vi.unstubAllGlobals();
});
