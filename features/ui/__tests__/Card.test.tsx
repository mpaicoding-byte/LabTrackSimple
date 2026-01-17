"use client";

import { render, screen } from "@testing-library/react";

import { Card } from "@/components/ui/card";

test("card uses shadcn theme tokens", () => {
  render(<Card data-testid="card" />);

  const card = screen.getByTestId("card");
  expect(card).toHaveClass("bg-card");
  expect(card).toHaveClass("text-card-foreground");
  expect(card).toHaveClass("shadow-sm");
});
