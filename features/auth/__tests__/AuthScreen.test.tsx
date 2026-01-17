"use client";

import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { AuthScreen } from "../AuthScreen";

vi.mock("@/features/core/supabaseClient", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  }),
}));

const sessionState = {
  session: null as { user: { id: string; email: string } } | null,
  loading: false,
  error: null as Error | null,
};

vi.mock("@/features/auth/SessionProvider", () => ({
  useSession: () => sessionState,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

test("auth mode toggle uses shadcn buttons", () => {
  render(<AuthScreen />);

  const toggle = screen.getByRole("button", { name: /create account/i });
  expect(toggle).toHaveAttribute("data-slot", "button");
});

test("auth screen uses shared loading state while session loads", () => {
  sessionState.loading = true;

  render(<AuthScreen />);

  expect(screen.getByTestId("loading-state")).toBeInTheDocument();

  sessionState.loading = false;
});
