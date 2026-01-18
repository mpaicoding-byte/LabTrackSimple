"use client";

import { describe, expect, test } from "vitest";

import { buildDuplicateDateLabels, splitDateLabel } from "../utils";

describe("buildDuplicateDateLabels", () => {
  test("appends numeric suffixes for duplicate dates", () => {
    const labels = buildDuplicateDateLabels([
      "2024-01-01",
      "2024-01-01",
      "2024-02-01",
      "2024-01-01",
    ]);

    expect(labels).toEqual([
      "1/1/2024",
      "-2",
      "2/1/2024",
      "-3",
    ]);
  });
});

describe("splitDateLabel", () => {
  test("splits duplicate suffixes onto a second line", () => {
    expect(splitDateLabel("1/10/2026-2")).toEqual(["1/10/2026", "-2"]);
  });

  test("leaves non-duplicate labels intact", () => {
    expect(splitDateLabel("1/10/2026")).toEqual(["1/10/2026", null]);
  });

  test("keeps suffix-only labels on one line", () => {
    expect(splitDateLabel("-2")).toEqual(["-2", null]);
  });
});
