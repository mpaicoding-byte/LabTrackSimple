"use client";

import { describe, expect, test } from "vitest";

import { buildDuplicateDateLabels, buildTrendGroups } from "../utils";

describe("buildDuplicateDateLabels", () => {
  test("adds numbered suffixes when a date repeats", () => {
    const labels = buildDuplicateDateLabels([
      "2024-01-01",
      "2024-01-01",
      "2024-02-01",
      "2024-01-01",
    ]);

    expect(labels).toEqual([
      "1/1/2024 (1)",
      "1/1/2024 (2)",
      "2/1/2024",
      "1/1/2024 (3)",
    ]);
  });
});

describe("buildTrendGroups", () => {
  test("orders numeric points by most recent date first", () => {
    const groups = buildTrendGroups([
      {
        id: "row-1",
        name_raw: "Glucose",
        value_raw: "90",
        value_num: 90,
        unit_raw: "mg/dL",
        lab_report_id: "report-1",
        lab_reports: { report_date: "2024-01-01", person_id: "person-1" },
      },
      {
        id: "row-2",
        name_raw: "Glucose",
        value_raw: "95",
        value_num: 95,
        unit_raw: "mg/dL",
        lab_report_id: "report-2",
        lab_reports: { report_date: "2024-03-01", person_id: "person-1" },
      },
      {
        id: "row-3",
        name_raw: "Glucose",
        value_raw: "92",
        value_num: 92,
        unit_raw: "mg/dL",
        lab_report_id: "report-3",
        lab_reports: { report_date: "2024-02-01", person_id: "person-1" },
      },
    ]);

    expect(groups[0].points.map((point) => point.date)).toEqual([
      "2024-03-01",
      "2024-02-01",
      "2024-01-01",
    ]);
  });
});
