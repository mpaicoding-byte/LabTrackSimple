"use client";

import { render, screen } from "@testing-library/react";

import { LoadingState } from "@/components/ui/loading-state";

test("loading state exposes a status role with consistent styling", () => {
  render(<LoadingState />);

  const status = screen.getByRole("status");
  expect(status).toHaveClass("text-muted-foreground");
  expect(screen.getByText("Loading")).toHaveClass("sr-only");
});
