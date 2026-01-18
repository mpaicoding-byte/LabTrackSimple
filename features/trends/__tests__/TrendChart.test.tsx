"use client";

import { render, screen } from "@testing-library/react";

import {
  COMPACT_CHART_DIMENSIONS,
  COMPACT_CHART_MARGINS,
  COMPACT_WIDTH_PER_POINT,
  TrendSparkline,
} from "../TrendChart";

const buildPoints = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    date: `2024-01-${String(index + 1).padStart(2, "0")}`,
    value: index + 1,
    valueRaw: String(index + 1),
    reportId: `report-${index + 1}`,
  }));

test("uses fixed height and width based on point count", () => {
  render(
    <TrendSparkline
      points={buildPoints(30)}
      compact
      ariaLabel="Trend chart for Glucose"
    />,
  );

  const chart = screen.getByRole("img", { name: /trend chart for glucose/i });
  const container = chart.querySelector("[data-slot='chart']") as HTMLElement | null;
  const height = Number(container?.style.height.replace("px", ""));
  const width = Number(container?.style.width.replace("px", ""));
  const minWidth = Number(container?.style.minWidth.replace("px", ""));
  const expectedHeight = COMPACT_CHART_DIMENSIONS.height;
  const spacingCount = Math.max(1, 30 - 1);
  const expectedWidth =
    spacingCount * COMPACT_WIDTH_PER_POINT +
    COMPACT_CHART_MARGINS.left +
    COMPACT_CHART_MARGINS.right;

  expect(height).toBeGreaterThan(0);
  expect(width).toBeGreaterThan(0);
  expect(height).toBe(expectedHeight);
  expect(width).toBe(expectedWidth);
  expect(minWidth).toBe(expectedWidth);
});
