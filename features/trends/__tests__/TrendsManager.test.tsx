"use client";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { formatDate } from "../utils";
import { TrendsManager } from "../TrendsManager";

vi.mock("@/components/layout/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const sessionState = {
  session: { user: { id: "user-1", email: "owner@example.com" } },
  loading: false,
  error: null as Error | null,
};

vi.mock("@/features/auth/SessionProvider", () => ({
  useSession: () => sessionState,
}));

const buildQuery = (data: unknown) => {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    order: vi.fn(() => chain),
    then: (resolve: (value: { data: unknown; error: null }) => void) =>
      resolve({ data, error: null }),
  };
  return chain;
};

let queryData: unknown = [];

vi.mock("@/features/core/supabaseClient", () => ({
  getSupabaseBrowserClient: () => ({
    from: vi.fn(() => buildQuery(queryData)),
  }),
}));

test("shows sign-in gate when no session", () => {
  sessionState.session = null;

  render(<TrendsManager />);

  expect(screen.getByText(/please sign in/i)).toBeInTheDocument();

  sessionState.session = { user: { id: "user-1", email: "owner@example.com" } };
});

test("shows loading state while session loads", () => {
  sessionState.loading = true;

  render(<TrendsManager />);

  expect(screen.getByTestId("loading-state")).toBeInTheDocument();

  sessionState.loading = false;
});

test("renders grouped tests with simple per-row trend charts", async () => {
  const user = userEvent.setup();

  queryData = [
    {
      id: "row-1",
      name_raw: "Glucose",
      value_raw: "90",
      value_num: 90,
      unit_raw: "mg/dL",
      lab_report_id: "report-1",
      lab_reports: { report_date: "2024-01-01", person_id: "person-1" },
    },
    {
      id: "row-2",
      name_raw: "Glucose",
      value_raw: "95",
      value_num: 95,
      unit_raw: "mg/dL",
      lab_report_id: "report-2",
      lab_reports: { report_date: "2024-02-01", person_id: "person-1" },
    },
    {
      id: "row-3",
      name_raw: "Glucose",
      value_raw: "100",
      value_num: 100,
      unit_raw: "mg/dL",
      lab_report_id: "report-3",
      lab_reports: { report_date: "2024-03-01", person_id: "person-1" },
    },
    {
      id: "row-4",
      name_raw: "Sodium",
      value_raw: "135",
      value_num: 135,
      unit_raw: "mmol/L",
      lab_report_id: "report-4",
      lab_reports: { report_date: "2024-01-05", person_id: "person-1" },
    },
    {
      id: "row-5",
      name_raw: "Sodium",
      value_raw: "136",
      value_num: 136,
      unit_raw: "mmol/L",
      lab_report_id: "report-5",
      lab_reports: { report_date: "2024-02-05", person_id: "person-1" },
    },
    {
      id: "row-6",
      name_raw: "CRP",
      value_raw: "Positive",
      value_num: null,
      unit_raw: null,
      lab_report_id: "report-6",
      lab_reports: { report_date: "2024-01-15", person_id: "person-1" },
    },
  ];

  render(<TrendsManager />);

  expect(await screen.findByText(/trends/i)).toBeInTheDocument();
  const testHeader = screen.getByRole("columnheader", { name: /^test$/i });
  expect(testHeader).toBeInTheDocument();
  expect(testHeader).toHaveClass("sticky");
  expect(screen.getByRole("columnheader", { name: /^trend$/i })).toBeInTheDocument();

  const glucoseRow = (await screen.findByText(/glucose/i)).closest("tr");
  expect(glucoseRow).not.toBeNull();
  const glucoseScope = within(glucoseRow!);
  const glucoseCell = glucoseScope.getByText(/glucose/i).closest("td");
  expect(glucoseCell).not.toBeNull();
  expect(glucoseCell).toHaveClass("sticky");
  expect(
    glucoseScope.getByLabelText(/trend chart for glucose/i),
  ).toBeInTheDocument();
  expect(
    glucoseScope.getAllByText(formatDate("2024-03-01")).length,
  ).toBeGreaterThan(0);

  const sodiumRow = (await screen.findByText(/sodium/i)).closest("tr");
  expect(sodiumRow).not.toBeNull();
  const sodiumScope = within(sodiumRow!);
  expect(
    sodiumScope.getByLabelText(/trend chart for sodium/i),
  ).toBeInTheDocument();

  const getChartHeight = (chart: HTMLElement) => {
    const container = chart.querySelector("[data-slot='chart']") as HTMLElement | null;
    const inlineHeight = container?.style.height ?? "";
    const attributeStyle = container?.getAttribute("style") ?? "";
    const match = inlineHeight.match(/(\d+)px/i) ?? attributeStyle.match(/height:\s*(\d+)px/i);
    return match ? Number(match[1]) : null;
  };

  const glucoseChart = glucoseScope.getByLabelText(/trend chart for glucose/i) as HTMLElement;
  const sodiumChart = sodiumScope.getByLabelText(/trend chart for sodium/i) as HTMLElement;
  const glucoseHeight = getChartHeight(glucoseChart);
  const sodiumHeight = getChartHeight(sodiumChart);
  expect(glucoseHeight).not.toBeNull();
  expect(sodiumHeight).not.toBeNull();
  expect(glucoseHeight).toBeGreaterThan(0);
  expect(sodiumHeight).toBeGreaterThan(0);

  const crpRow = (await screen.findByText(/crp/i)).closest("tr");
  expect(crpRow).not.toBeNull();
  const crpScope = within(crpRow!);
  expect(crpScope.getByText(/no chart/i)).toBeInTheDocument();

  await user.type(screen.getByPlaceholderText(/search tests/i), "crp");
  expect(await screen.findByText(/crp/i)).toBeInTheDocument();
  expect(screen.queryByText(/glucose/i)).not.toBeInTheDocument();
});
