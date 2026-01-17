"use client";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ReviewManager } from "../ReviewManager";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/reports/report-1/review",
  useParams: () => ({ reportId: "report-1" }),
}));

vi.mock("@/components/layout/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/features/auth/SessionProvider", () => ({
  useSession: () => ({
    session: { user: { id: "user-1", email: "owner@example.com" } },
    loading: false,
    error: null,
  }),
}));

const reportRow = {
  id: "report-1",
  person_id: "person-1",
  report_date: "2024-01-01",
  status: "review_required",
  current_extraction_run_id: "run-1",
  deleted_at: null,
};

const personRow = {
  id: "person-1",
  name: "Alex Example",
};

const buildSupabaseMock = ({
  role = "owner",
  reportStatus = "review_required",
  reportDeletedAt = null,
  runRow = { id: "run-1", status: "ready" },
  resultRows = [],
  artifactRow = null,
} = {}) => {
  const updateMock = vi.fn<
    (payload: Record<string, unknown>) => {
      eq: () => Promise<{ data: null; error: null }>;
    }
  >(() => ({
    eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
  }));

  const insertMock = vi.fn(() => ({
    select: vi.fn(() => ({
      data: [
        {
          id: "inserted-row-1",
          name_raw: "Manual Test",
          value_raw: "1",
          unit_raw: null,
          value_num: 1,
          details_raw: null,
          edited_at: null,
        },
      ],
      error: null,
    })),
  }));

  const invokeMock = vi.fn().mockResolvedValue({
    data: { status: "final" },
    error: null,
  });

  const createSignedUrlMock = vi.fn().mockResolvedValue({
    data: { signedUrl: "https://example.com/artifact.pdf" },
    error: null,
  });

  const buildQuery = (data: unknown) => {
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      is: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => ({ data, error: null })),
      then: (resolve: (value: { data: unknown; error: null }) => void) =>
        resolve({ data, error: null }),
    };
    return chain;
  };

  return {
    from: (table: string) => {
      if (table === "household_members") {
        return buildQuery({ household_id: "household-1", role });
      }

      if (table === "lab_reports") {
        return {
          ...buildQuery({
            ...reportRow,
            status: reportStatus,
            deleted_at: reportDeletedAt,
          }),
          update: updateMock,
        };
      }

      if (table === "people") {
        return buildQuery(personRow);
      }

      if (table === "extraction_runs") {
        return {
          ...buildQuery(runRow),
          update: updateMock,
        };
      }

      if (table === "lab_results") {
        return {
          ...buildQuery(resultRows),
          insert: insertMock,
          update: updateMock,
        };
      }

      if (table === "lab_artifacts") {
        return buildQuery(artifactRow);
      }

      return buildQuery(null);
    },
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: createSignedUrlMock,
      })),
    },
    functions: {
      invoke: invokeMock,
    },
    _mocks: { insertMock, updateMock, invokeMock, createSignedUrlMock },
  };
};

let supabaseMock = buildSupabaseMock();

vi.mock("@/features/core/supabaseClient", () => ({
  getSupabaseBrowserClient: () => supabaseMock,
}));

const renderReview = (options = {}) => {
  supabaseMock = buildSupabaseMock(options);
  return render(<ReviewManager reportId="report-1" />);
};

test("renders extracted rows and confirm actions", async () => {
  renderReview({
    resultRows: [
      {
        id: "row-1",
        name_raw: "Glucose",
        value_raw: "90",
        unit_raw: "mg/dL",
        value_num: 90,
        details_raw: null,
        edited_at: null,
      },
    ],
  });

  expect(await screen.findByDisplayValue("Glucose")).toBeVisible();
  expect(screen.getByRole("button", { name: /review & confirm/i })).toBeVisible();
  expect(screen.getByRole("button", { name: /add test/i })).toBeVisible();
  expect(screen.queryByRole("button", { name: /edit/i })).toBeNull();
  expect(screen.queryByRole("button", { name: /^Approve$/i })).toBeNull();
});

test("final report enters draft mode on edit", async () => {
  const user = userEvent.setup();

  renderReview({
    reportStatus: "final",
    resultRows: [
      {
        id: "row-1",
        name_raw: "Glucose",
        value_raw: "90",
        unit_raw: "mg/dL",
        value_num: 90,
        details_raw: null,
        edited_at: null,
      },
    ],
  });

  expect(await screen.findByText("Glucose")).toBeVisible();
  expect(screen.getByRole("button", { name: /edit/i })).toBeVisible();
  expect(screen.queryByRole("button", { name: /review & confirm/i })).toBeNull();
  expect(screen.queryByRole("button", { name: /add test/i })).toBeNull();
  expect(screen.queryByLabelText(/name/i)).toBeNull();

  await user.click(screen.getByRole("button", { name: /edit/i }));

  expect(await screen.findByRole("button", { name: /discard draft/i })).toBeVisible();
  expect(screen.getByRole("button", { name: /review & confirm/i })).toBeVisible();
  expect(screen.getByRole("button", { name: /add test/i })).toBeVisible();
  expect(screen.getByLabelText(/name/i)).toBeVisible();
});

test("confirm saves pending edits and marks edited", async () => {
  const user = userEvent.setup();

  renderReview({
    resultRows: [
      {
        id: "row-1",
        name_raw: "Glucose",
        value_raw: "90",
        unit_raw: "mg/dL",
        value_num: 90,
        details_raw: null,
        edited_at: null,
      },
    ],
  });

  await screen.findByDisplayValue("Glucose");

  const nameInput = screen.getByLabelText(/^name$/i);
  const valueInput = screen.getByLabelText(/^Value$/i);
  fireEvent.change(nameInput, { target: { value: "Fasting Glucose" } });
  fireEvent.change(valueInput, { target: { value: "95" } });

  await user.click(screen.getByRole("button", { name: /review & confirm/i }));

  await waitFor(() => {
    expect(supabaseMock._mocks.updateMock).toHaveBeenCalled();
  });

  expect(supabaseMock._mocks.updateMock.mock.calls[0][0]).toMatchObject({
    name_raw: "Fasting Glucose",
    value_raw: "95",
  });
  const editedLabels = await screen.findAllByText(/edited/i);
  expect(editedLabels.length).toBeGreaterThan(0);
});

test("confirm button invokes confirm_report_results", async () => {
  const user = userEvent.setup();

  renderReview({
    resultRows: [
      {
        id: "row-1",
        name_raw: "Glucose",
        value_raw: "90",
        unit_raw: "mg/dL",
        value_num: 90,
        details_raw: null,
        edited_at: null,
      },
    ],
  });

  const confirmButton = await screen.findByRole("button", { name: /review & confirm/i });
  await user.click(confirmButton);
  await waitFor(() => {
    expect(supabaseMock._mocks.invokeMock).toHaveBeenCalled();
  });
});

test("preview button links to the signed URL when available", async () => {
  renderReview({
    artifactRow: {
      id: "artifact-1",
      object_path: "reports/report.pdf",
      kind: "pdf",
    },
    resultRows: [
      {
        id: "row-1",
        name_raw: "Glucose",
        value_raw: "90",
        unit_raw: "mg/dL",
        value_num: 90,
        details_raw: null,
        edited_at: null,
      },
    ],
  });

  const previewLink = await screen.findByRole("link", { name: /preview document/i });
  await waitFor(() => {
    expect(supabaseMock._mocks.createSignedUrlMock).toHaveBeenCalled();
  });
  expect(previewLink).toHaveAttribute("href", "https://example.com/artifact.pdf");
});

test("shows an error when the report is deleted", async () => {
  renderReview({
    reportDeletedAt: "2024-02-01T00:00:00Z",
  });

  expect(await screen.findByText(/report not found/i)).toBeVisible();
});

test("empty state messaging when no results exist", async () => {
  renderReview({ resultRows: [] });

  expect(await screen.findByText(/no results yet/i)).toBeVisible();
  expect(screen.getByRole("button", { name: /add test/i })).toBeVisible();
});
