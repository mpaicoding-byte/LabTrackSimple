"use client";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ReportsManager } from "../ReportsManager";

let mockedSelectedDate: Date | undefined;

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
  user_id?: string | null;
  household_id?: string | null;
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
let memberData: { household_id: string; role: string } | null = null;

const applyPeopleFilters = (
  data: PersonRow[],
  filters: Map<string, unknown>,
) => {
  let filtered = data;
  if (filters.has("user_id")) {
    const userId = filters.get("user_id");
    filtered = filtered.filter((row) => row.user_id === userId);
  }
  if (filters.has("household_id")) {
    const householdId = filters.get("household_id");
    filtered = filtered.filter((row) => row.household_id === householdId);
  }
  return filtered;
};

const applyReportFilters = (
  data: ReportRow[],
  filters: Map<string, unknown>,
) => {
  let filtered = data;
  if (filters.has("person_id")) {
    const personId = filters.get("person_id");
    filtered = filtered.filter((row) => row.person_id === personId);
  }
  if (filters.has("household_id")) {
    const householdId = filters.get("household_id");
    filtered = filtered.filter((row) => row.household_id === householdId);
  }
  return filtered;
};

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

const insertArtifactMock = vi.fn<
  (payload: Record<string, unknown>) => { error: null }
>(() => ({ error: null }));

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

const insertRunMock = vi.fn<
  (payload: Record<string, unknown>) => {
    select: () => {
      single: () => Promise<{ data: { id: string; status: string }; error: null }>;
    };
  }
>(() => ({
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
      const filters = new Map<string, unknown>();
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn((key: string, value: unknown) => {
          filters.set(key, value);
          return chain;
        }),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: memberData,
          error: null,
        }),
      };
      return chain;
    }

    if (table === "people") {
      const filters = new Map<string, unknown>();
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn((key: string, value: unknown) => {
          filters.set(key, value);
          return chain;
        }),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: applyPeopleFilters(peopleData, filters),
          error: null,
        }),
        then: (resolve: (value: { data: PersonRow[]; error: null }) => void) => {
          resolve({ data: applyPeopleFilters(peopleData, filters), error: null });
        },
      };
      return chain;
    }

    if (table === "lab_reports") {
      const filters = new Map<string, unknown>();
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn((key: string, value: unknown) => {
          filters.set(key, value);
          return chain;
        }),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: applyReportFilters(reportsData, filters),
          error: null,
        }),
        insert: insertReportMock,
        update: updateReportMock,
      };
      return chain;
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

vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect }: { onSelect?: (date: Date | undefined) => void }) => (
    <button
      type="button"
      data-testid="calendar-mock"
      onClick={() => onSelect?.(mockedSelectedDate)}
    />
  ),
}));

const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
);

vi.mock("sonner", () => ({
  toast: toastMock,
}));

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
      user_id: "user-1",
      household_id: "household-1",
    },
  ];
  reportsData = [];
  memberData = { household_id: "household-1", role: "owner" };
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

test("shows an add tests manually action for owners", async () => {
  render(<ReportsManager />);

  await screen.findByRole("heading", { name: /lab reports/i });

  expect(
    screen.getByRole("button", { name: /add tests manually/i }),
  ).toBeInTheDocument();
});

test("owners can create a manual report from the reports page", async () => {
  render(<ReportsManager />);

  await userEvent.click(
    await screen.findByRole("button", { name: /add tests manually/i }),
  );

  await screen.findByRole("heading", { name: /manual report/i });

  await userEvent.click(
    await screen.findByRole("button", { name: /ada lovelace/i }),
  );

  const dateTrigger = screen.getByLabelText(/report date/i);
  await userEvent.click(dateTrigger);
  const today = new Date();
  const selectedDate = new Date(today.getFullYear(), today.getMonth(), 12);
  mockedSelectedDate = selectedDate;
  await userEvent.click(screen.getByTestId("calendar-mock"));

  await userEvent.click(
    screen.getByRole("button", { name: /create manual report/i }),
  );

  await waitFor(() => {
    expect(insertReportMock).toHaveBeenCalled();
  });

  expect(insertReportMock).toHaveBeenCalledWith(
    expect.objectContaining({
      household_id: "household-1",
      person_id: "person-1",
      report_date: formatDateValue(selectedDate),
      source: "Manual entry",
      status: "review_required",
    }),
  );

  await waitFor(() => {
    expect(pushMock).toHaveBeenCalledWith("/reports/report-1/review");
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

  const dateTrigger = screen.getByLabelText(/report date/i);
  await userEvent.click(dateTrigger);
  const today = new Date();
  const selectedDate = new Date(today.getFullYear(), today.getMonth(), 10);
  mockedSelectedDate = selectedDate;
  await userEvent.click(screen.getByTestId("calendar-mock"));

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
      report_date: formatDateValue(selectedDate),
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

  const dateTrigger = screen.getByLabelText(/report date/i);
  await userEvent.click(dateTrigger);
  const today = new Date();
  const selectedDate = new Date(today.getFullYear(), today.getMonth(), 10);
  mockedSelectedDate = selectedDate;
  await userEvent.click(screen.getByTestId("calendar-mock"));

  await userEvent.click(
    screen.getByRole("button", { name: /save report/i }),
  );

  expect(await screen.findByText(/insert failed/i)).toBeInTheDocument();
  expect(toastMock.error).toHaveBeenCalled();
});

test("owners do not see delete action in the report list", async () => {
  reportsData = [
    {
      id: "report-1",
      household_id: "household-1",
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

  expect(
    within(reportCard as HTMLElement).queryByRole("button", { name: /delete/i }),
  ).toBeNull();
});

test("shows view for final reports and review for reports needing review", async () => {
  peopleData = [
    { id: "person-1", name: "Ada Lovelace", household_id: "household-1" },
    { id: "person-2", name: "Grace Hopper", household_id: "household-1" },
  ];
  reportsData = [
    {
      id: "report-final",
      household_id: "household-1",
      person_id: "person-1",
      report_date: "2024-01-10",
      source: "Uploaded via Web",
      status: "final",
      created_at: "2024-01-10T00:00:00Z",
    },
    {
      id: "report-review",
      household_id: "household-1",
      person_id: "person-2",
      report_date: "2024-02-01",
      source: "Uploaded via Web",
      status: "review_required",
      created_at: "2024-02-01T00:00:00Z",
    },
  ];

  render(<ReportsManager />);

  await screen.findByRole("heading", { name: /lab reports/i });

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

test("filters reports by family member tab for owners", async () => {
  const user = userEvent.setup();

  peopleData = [
    { id: "person-1", name: "Ada Lovelace", household_id: "household-1" },
    { id: "person-2", name: "Grace Hopper", household_id: "household-1" },
  ];
  reportsData = [
    {
      id: "report-1",
      household_id: "household-1",
      person_id: "person-1",
      report_date: "2024-01-10",
      source: "Uploaded via Web",
      status: "final",
      created_at: "2024-01-10T00:00:00Z",
    },
    {
      id: "report-2",
      household_id: "household-1",
      person_id: "person-2",
      report_date: "2024-02-01",
      source: "Uploaded via Web",
      status: "review_required",
      created_at: "2024-02-01T00:00:00Z",
    },
  ];

  render(<ReportsManager />);

  expect(await screen.findByRole("tab", { name: /all family/i })).toBeInTheDocument();
  await screen.findByRole("tab", { name: /ada lovelace/i });
  await screen.findByRole("tab", { name: /grace hopper/i });

  await user.click(screen.getByRole("tab", { name: /ada lovelace/i }));
  expect(await screen.findByRole("heading", { name: /ada lovelace/i })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /grace hopper/i })).toBeNull();
});

test("members only see their own reports tab", async () => {
  memberData = { household_id: "household-1", role: "member" };
  peopleData = [
    {
      id: "person-1",
      name: "Ada Lovelace",
      user_id: "user-1",
      household_id: "household-1",
    },
    {
      id: "person-2",
      name: "Grace Hopper",
      user_id: "user-2",
      household_id: "household-1",
    },
  ];
  reportsData = [
    {
      id: "report-1",
      household_id: "household-1",
      person_id: "person-1",
      report_date: "2024-01-10",
      source: "Uploaded via Web",
      status: "final",
      created_at: "2024-01-10T00:00:00Z",
    },
    {
      id: "report-2",
      household_id: "household-1",
      person_id: "person-2",
      report_date: "2024-02-01",
      source: "Uploaded via Web",
      status: "review_required",
      created_at: "2024-02-01T00:00:00Z",
    },
  ];

  render(<ReportsManager />);

  expect(await screen.findByRole("tab", { name: /ada lovelace/i })).toBeInTheDocument();
  expect(screen.queryByRole("tab", { name: /all family/i })).toBeNull();
  expect(screen.queryByRole("tab", { name: /grace hopper/i })).toBeNull();

  expect(await screen.findByRole("heading", { name: /ada lovelace/i })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /grace hopper/i })).toBeNull();
});
