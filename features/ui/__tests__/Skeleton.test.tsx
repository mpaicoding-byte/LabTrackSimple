"use client";

import { render, screen } from "@testing-library/react";

import { Skeleton } from "@/components/ui/skeleton";

test("renders a skeleton with base classes", () => {
  render(<Skeleton data-testid="skeleton" className="h-4 w-10" />);

  const skeleton = screen.getByTestId("skeleton");
  expect(skeleton).toHaveClass("animate-pulse");
  expect(skeleton).toHaveClass("h-4");
});
