"use client";

import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { TrendsManager } from "../TrendsManager";

const sessionState = {
  session: { user: { id: "user-1", email: "owner@example.com" } },
  loading: false,
  error: null as Error | null,
};

vi.mock("@/components/layout/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/features/auth/SessionProvider", () => ({
  useSession: () => sessionState,
}));

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

type QueryConfig = {
  data: unknown;
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
          const filtered = (
            config.data as Array<{ lab_reports?: { person_id?: string } }>
          ).filter((row) => row.lab_reports?.person_id === personFilter);
          resolve({ data: filtered, error: null });
          return;
        }
      }
      if (table === "people") {
        resolve({ data: applyPeopleFilters(config.data as PersonRecord[], filters), error: null });
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

const trendSparklineMock = vi.fn();

vi.mock("../TrendChart", () => ({
  TrendSparkline: (props: { yDomain?: [number, number] | null }) => {
    trendSparklineMock(props);
    return <div data-testid="mock-chart" />;
  },
}));

test("does not pass a global y-axis domain into TrendSparkline", async () => {
  memberData = { household_id: "house-1", role: "owner" };
  peopleData = [
    {
      id: "person-1",
      name: "Avery",
      created_at: "2024-01-01",
      household_id: "house-1",
      user_id: "user-1",
    },
  ];
  resultsData = [
    {
      id: "row-1",
      name_raw: "CRP",
      value_raw: "2",
      value_num: 2,
      unit_raw: "mg/L",
      lab_report_id: "report-1",
      lab_reports: { report_date: "2024-01-01", person_id: "person-1" },
    },
  ];

  render(<TrendsManager />);

  expect(await screen.findByTestId("mock-chart")).toBeInTheDocument();
  const props = trendSparklineMock.mock.calls[0]?.[0];
  expect(props?.yDomain).toBeUndefined();
});
