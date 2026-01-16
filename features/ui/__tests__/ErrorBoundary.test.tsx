"use client";

import { render, screen } from "@testing-library/react";

import { ErrorBoundary } from "@/components/ui/error-boundary";

const Boom = () => {
  throw new Error("boom");
};

test("renders fallback when a child throws", () => {
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>,
  );

  expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i);
});
