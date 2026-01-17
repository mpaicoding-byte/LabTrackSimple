"use client";

import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { PeopleManager } from "../PeopleManager";

vi.mock("next/navigation", () => ({
  usePathname: () => "/people",
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
  is: vi.fn(() => chain),
  maybeSingle: vi.fn(() => pending),
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

test("shows shared loading state while loading people", () => {
  render(<PeopleManager />);

  expect(screen.getByTestId("loading-state")).toBeInTheDocument();
});
