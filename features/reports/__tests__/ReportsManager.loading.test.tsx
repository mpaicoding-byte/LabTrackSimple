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

const pending = new Promise(() => {});

const chain = {
  select: vi.fn(() => chain),
  eq: vi.fn(() => chain),
  maybeSingle: vi.fn(() => pending),
  is: vi.fn(() => chain),
  order: vi.fn(() => pending),
};

vi.mock("@/features/core/supabaseClient", () => ({
  getSupabaseBrowserClient: () => ({
    from: vi.fn(() => chain),
  }),
}));

vi.mock("@/features/auth/SessionProvider", () => ({
  useSession: () => ({
    session: { user: { id: "user-1", email: "owner@example.com" } },
    loading: false,
    error: null,
  }),
}));

test("shows shared loading state while reports load", () => {
  render(<ReportsManager />);

  expect(screen.getByTestId("loading-state")).toBeInTheDocument();
});
