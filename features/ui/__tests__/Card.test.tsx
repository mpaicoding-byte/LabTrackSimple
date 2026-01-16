"use client";

import { render, screen } from "@testing-library/react";

import { Card } from "@/components/ui/card";

test("card includes light mode styling classes", () => {
  render(<Card data-testid="card" />);

  const card = screen.getByTestId("card");
  expect(card).toHaveClass("bg-white/80");
  expect(card).toHaveClass("border-zinc-200/80");
});
