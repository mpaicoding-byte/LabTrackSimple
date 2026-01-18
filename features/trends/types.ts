"use client";

export type TrendRow = {
  id: string;
  name_raw: string | null;
  value_raw: string | null;
  value_num: number | null;
  unit_raw: string | null;
  lab_report_id: string;
  lab_reports?: {
    report_date: string;
    person_id: string;
    deleted_at?: string | null;
  } | null;
};

export type TrendPoint = {
  date: string;
  value: number;
  valueRaw: string | null;
  reportId: string;
};

export type TextEntry = {
  date: string;
  value: string;
  reportId: string;
};

export type TrendGroup = {
  key: string;
  name: string;
  unit: string | null;
  latestValue: string | null;
  latestDate: string | null;
  points: TrendPoint[];
  textEntries: TextEntry[];
};
