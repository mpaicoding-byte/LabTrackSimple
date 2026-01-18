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

let queryData: unknown = [];

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

vi.mock("@/features/core/supabaseClient", () => ({
  getSupabaseBrowserClient: () => ({
    from: vi.fn(() => buildQuery(queryData)),
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
  queryData = [
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
