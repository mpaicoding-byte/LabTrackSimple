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

type QueryConfig = {
  data: unknown;
};

type PersonRecord = {
  id: string;
  name: string;
  created_at?: string;
  user_id?: string | null;
  household_id?: string | null;
};

const applyPeopleFilters = (
  data: PersonRecord[],
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

const buildQuery = (table: string, config: QueryConfig) => {
  const filters = new Map<string, unknown>();
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn((key: string, value: unknown) => {
      filters.set(key, value);
      return chain;
    }),
    in: vi.fn((key: string, value: unknown) => {
      filters.set(key, value);
      return chain;
    }),
    is: vi.fn(() => chain),
    order: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve({ data: config.data, error: null })),
    then: (resolve: (value: { data: unknown; error: null }) => void) => {
      if (table === "lab_results") {
        const personFilter = filters.get("lab_reports.person_id");
        if (Array.isArray(personFilter)) {
          const filtered = (
            config.data as Array<{ lab_reports?: { person_id?: string } }>
          ).filter((row) => personFilter.includes(row.lab_reports?.person_id ?? ""));
          resolve({ data: filtered, error: null });
          return;
        }
        if (personFilter) {
          const filtered = (config.data as Array<{ lab_reports?: { person_id?: string } }>).filter(
            (row) => row.lab_reports?.person_id === personFilter,
          );
          resolve({ data: filtered, error: null });
          return;
        }
      }
      if (table === "people") {
        const filtered = applyPeopleFilters(
          config.data as PersonRecord[],
          filters,
        );
        resolve({ data: filtered, error: null });
        return;
      }
      resolve({ data: config.data, error: null });
    },
  };
  return chain;
};

let resultsData: unknown = [];
let peopleData: PersonRecord[] = [];
let memberData: { household_id: string; role: string } | null = null;

vi.mock("@/features/core/supabaseClient", () => ({
  getSupabaseBrowserClient: () => ({
    from: vi.fn((table: string) => {
      if (table === "household_members") {
        return buildQuery(table, { data: memberData });
      }
      if (table === "people") {
        return buildQuery(table, { data: peopleData });
      }
      return buildQuery(table, { data: resultsData });
    }),
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

  memberData = { household_id: "house-1", role: "owner" };
  peopleData = [
    {
      id: "person-1",
      name: "Avery",
      created_at: "2024-01-01",
      user_id: "user-1",
      household_id: "house-1",
    },
    {
      id: "person-2",
      name: "Jordan",
      created_at: "2024-01-02",
      user_id: "user-2",
      household_id: "house-1",
    },
  ];
  resultsData = [
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

test("filters results by family member tab", async () => {
  const user = userEvent.setup();

  memberData = { household_id: "house-1", role: "owner" };
  peopleData = [
    {
      id: "person-1",
      name: "Avery",
      created_at: "2024-01-01",
      user_id: "user-1",
      household_id: "house-1",
    },
    {
      id: "person-2",
      name: "Jordan",
      created_at: "2024-01-02",
      user_id: "user-2",
      household_id: "house-1",
    },
    {
      id: "person-3",
      name: "Quinn",
      created_at: "2024-01-03",
      user_id: "user-3",
      household_id: "house-1",
    },
  ];
  resultsData = [
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
      name_raw: "Sodium",
      value_raw: "135",
      value_num: 135,
      unit_raw: "mmol/L",
      lab_report_id: "report-2",
      lab_reports: { report_date: "2024-01-05", person_id: "person-2" },
    },
  ];

  render(<TrendsManager />);

  expect(screen.queryByRole("tab", { name: /all family/i })).toBeNull();
  await screen.findByRole("tab", { name: /avery/i });
  await screen.findByRole("tab", { name: /jordan/i });
  expect(screen.queryByRole("tab", { name: /quinn/i })).toBeNull();

  await user.click(screen.getByRole("tab", { name: /avery/i }));
  expect(await screen.findByText(/glucose/i)).toBeInTheDocument();
  expect(screen.queryByText(/sodium/i)).not.toBeInTheDocument();
});

test("members only see their own tab and results", async () => {
  memberData = { household_id: "house-1", role: "member" };
  peopleData = [
    {
      id: "person-1",
      name: "Avery",
      created_at: "2024-01-01",
      user_id: "user-1",
      household_id: "house-1",
    },
    {
      id: "person-2",
      name: "Jordan",
      created_at: "2024-01-02",
      user_id: "user-2",
      household_id: "house-1",
    },
  ];
  resultsData = [
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
      name_raw: "Sodium",
      value_raw: "135",
      value_num: 135,
      unit_raw: "mmol/L",
      lab_report_id: "report-2",
      lab_reports: { report_date: "2024-01-05", person_id: "person-2" },
    },
  ];

  render(<TrendsManager />);

  expect(await screen.findByRole("tab", { name: /avery/i })).toBeInTheDocument();
  expect(screen.queryByRole("tab", { name: /all family/i })).toBeNull();
  expect(screen.queryByRole("tab", { name: /jordan/i })).toBeNull();

  expect(await screen.findByText(/glucose/i)).toBeInTheDocument();
  expect(screen.queryByText(/sodium/i)).not.toBeInTheDocument();
});
