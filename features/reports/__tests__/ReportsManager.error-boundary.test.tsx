"use client";

import { render, screen } from "@testing-library/react";
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

vi.mock("@/components/layout/DashboardLayout", () => ({
  DashboardLayout: () => {
    throw new Error("boom");
  },
}));

vi.mock("@/features/core/supabaseClient", () => ({
  getSupabaseBrowserClient: () => ({
    from: vi.fn(),
  }),
}));

vi.mock("@/features/auth/SessionProvider", () => ({
  useSession: () => ({
    session: null,
    loading: true,
    error: null,
  }),
}));

test("reports manager shows error fallback when layout fails", () => {
  render(<ReportsManager />);

  expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i);
});
