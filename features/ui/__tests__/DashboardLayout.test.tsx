"use client";

import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/layout/AppSidebar", () => ({
  AppSidebar: () => <aside data-testid="sidebar" />,
}));

test("renders a mobile header container", () => {
  render(
    <DashboardLayout>
      <div>Content</div>
    </DashboardLayout>,
  );

  expect(screen.getByTestId("mobile-header")).toBeInTheDocument();
});
