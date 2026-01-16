"use client";

import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import DashboardPage from "@/app/page";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
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

const chain = {
  select: vi.fn(() => chain),
  gte: vi.fn(() => chain),
  order: vi.fn(() => chain),
  limit: vi.fn(() => chain),
  then: (resolve: (value: { count: number; data: [] }) => void) => {
    resolve({ count: 0, data: [] });
  },
};

vi.mock("@/features/core/supabaseClient", () => ({
  getSupabaseBrowserClient: () => ({
    from: vi.fn(() => chain),
  }),
}));

test("shows skeletons for stats while loading", () => {
  render(<DashboardPage />);

  expect(screen.getAllByTestId("stats-skeleton")).toHaveLength(3);
});
