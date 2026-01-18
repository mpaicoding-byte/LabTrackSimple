"use client";

import type { TrendGroup, TrendRow } from "./types";

export const formatDate = (value: string | null) => {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export const buildDuplicateDateLabels = (dates: string[]) => {
  const totals = new Map<string, number>();
  dates.forEach((date) => {
    const label = formatDate(date);
    totals.set(label, (totals.get(label) ?? 0) + 1);
  });

  const seen = new Map<string, number>();

  return dates.map((date) => {
    const label = formatDate(date);
    const total = totals.get(label) ?? 1;
    if (total <= 1) return label;
    const nextCount = (seen.get(label) ?? 0) + 1;
    seen.set(label, nextCount);
    return `${label} (${nextCount})`;
  });
};

const buildTrendKey = (name: string, unit: string | null) =>
  `${name.toLowerCase()}__${unit ?? ""}`;

export const buildTrendGroups = (rows: TrendRow[]): TrendGroup[] => {
  const grouped = new Map<string, TrendGroup>();

  rows.forEach((row) => {
    const name = row.name_raw?.trim();
    const reportDate = row.lab_reports?.report_date ?? null;
    if (!name || !reportDate) return;

    const unit = row.unit_raw?.trim() || null;
    const key = buildTrendKey(name, unit);

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        name,
        unit,
        latestValue: null,
        latestDate: null,
        points: [],
        textEntries: [],
      });
    }

    const group = grouped.get(key)!;
    const dateValue = new Date(reportDate).getTime();
    const latestValueDate = group.latestDate ? new Date(group.latestDate).getTime() : -Infinity;
    if (dateValue >= latestValueDate) {
      group.latestDate = reportDate;
      group.latestValue = row.value_raw ?? (row.value_num !== null ? String(row.value_num) : null);
    }

    if (row.value_num !== null && !Number.isNaN(row.value_num)) {
      group.points.push({
        date: reportDate,
        value: row.value_num,
        valueRaw: row.value_raw ?? String(row.value_num),
        reportId: row.lab_report_id,
      });
    } else if (row.value_raw) {
      group.textEntries.push({
        date: reportDate,
        value: row.value_raw,
        reportId: row.lab_report_id,
      });
    }
  });

  const groups = Array.from(grouped.values());

  groups.forEach((group) => {
    group.points.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    group.textEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  return groups.sort((a, b) => {
    const aDate = a.latestDate ? new Date(a.latestDate).getTime() : 0;
    const bDate = b.latestDate ? new Date(b.latestDate).getTime() : 0;
    return bDate - aDate;
  });
};
