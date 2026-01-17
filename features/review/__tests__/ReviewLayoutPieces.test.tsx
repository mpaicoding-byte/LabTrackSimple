"use client";

import { render, screen } from "@testing-library/react";

import { ReviewLoadingState } from "../ReviewLayoutPieces";

test("review loading uses shared loading state", () => {
  render(<ReviewLoadingState />);

  expect(screen.getByTestId("loading-state")).toBeInTheDocument();
});
