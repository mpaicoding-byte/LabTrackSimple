"use client";

import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { PeopleManager } from "../PeopleManager";

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

test("people manager shows error fallback when layout fails", () => {
  render(<PeopleManager />);

  expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i);
});
