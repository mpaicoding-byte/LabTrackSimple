"use client";

import { render } from "@testing-library/react";
import { vi } from "vitest";

import { AppSidebar } from "@/components/layout/AppSidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/reports",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/features/auth/SessionProvider", () => ({
  useSession: () => ({
    session: { user: { id: "user-1", email: "owner@example.com" } },
    loading: false,
    error: null,
  }),
}));

vi.mock("@/features/core/supabaseClient", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

test("sidebar uses shadcn token styling", () => {
  const { container } = render(<AppSidebar />);

  const aside = container.querySelector("aside");
  expect(aside).not.toBeNull();
  expect(aside).toHaveClass("bg-background");
  expect(aside).toHaveClass("border-border");
});
