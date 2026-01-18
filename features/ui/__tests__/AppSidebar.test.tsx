"use client";

import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

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

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({
    signOut: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

test("sidebar uses shadcn token styling", () => {
  const { container } = render(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>,
  );

  const sidebar = container.querySelector('[data-slot="sidebar-inner"]');
  expect(sidebar).not.toBeNull();
  expect(sidebar).toHaveClass("bg-sidebar");
});

test("sidebar includes the trends link", () => {
  render(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>,
  );

  expect(screen.getByRole("link", { name: /trends/i })).toBeInTheDocument();
});
