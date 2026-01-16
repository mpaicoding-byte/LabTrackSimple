import { test } from "node:test";
import assert from "node:assert/strict";

import { handleConfirmReportResults } from "../supabase/functions/confirm_report_results/handler.js";

const buildSupabase = ({
  reportRow = null,
  personRow = null,
  ownerRow = null,
  runRow = null,
  resultRows = [],
} = {}) => {
  const insertCalls = [];
  const updateCalls = [];

  const makeSingle = (row) => {
    const query = {
      select: () => query,
      eq: () => query,
      is: () => query,
      maybeSingle: async () => ({ data: row, error: null }),
    };
    return query;
  };

  const makeList = (rows) => {
    const query = {
      select: () => query,
      eq: () => query,
      is: () => query,
      then: (resolve) => resolve({ data: rows, error: null }),
    };
    return query;
  };

  const makeUpdate = (table) => ({
    update: (payload) => {
      updateCalls.push({ table, payload });
      const chain = {
        eq: () => chain,
        neq: () => chain,
        is: () => Promise.resolve({ data: null, error: null }),
      };
      return chain;
    },
  });

  const makeInsert = (table) => ({
    insert: (payload) => {
      insertCalls.push({ table, payload });
      return { data: payload, error: null };
    },
  });

  return {
    from: (table) => {
      if (table === "lab_reports") {
        return {
          ...makeSingle(reportRow),
          ...makeUpdate(table),
        };
      }

      if (table === "people") {
        return makeSingle(personRow);
      }

      if (table === "household_members") {
        return makeSingle(ownerRow);
      }

      if (table === "extraction_runs") {
        return {
          ...makeSingle(runRow),
          ...makeUpdate(table),
        };
      }

      if (table === "lab_results") {
        return {
          ...makeList(resultRows),
          ...makeUpdate(table),
          ...makeInsert(table),
        };
      }

      return makeList([]);
    },
    _calls: { insertCalls, updateCalls },
  };
};

test("confirm_report_results returns 400 when lab_report_id is missing", async () => {
  const supabase = buildSupabase();
  const result = await handleConfirmReportResults({
    supabase,
    payload: {},
    userId: "user-1",
  });

  assert.equal(result.status, 400);
});

test("confirm_report_results returns 404 when the report does not exist", async () => {
  const supabase = buildSupabase({ reportRow: null });
  const result = await handleConfirmReportResults({
    supabase,
    payload: { lab_report_id: "report-1" },
    userId: "user-1",
  });

  assert.equal(result.status, 404);
});

test("confirm_report_results fails when no current extraction run exists", async () => {
  const supabase = buildSupabase({
    reportRow: { id: "report-1", person_id: "person-1", current_extraction_run_id: null },
    personRow: { id: "person-1", household_id: "household-1" },
    ownerRow: { id: "member-1" },
  });

  const result = await handleConfirmReportResults({
    supabase,
    payload: { lab_report_id: "report-1" },
    userId: "user-1",
  });

  assert.equal(result.status, 400);
});

test("confirm_report_results fails if there are zero rows for the run", async () => {
  const supabase = buildSupabase({
    reportRow: { id: "report-1", person_id: "person-1", current_extraction_run_id: "run-1" },
    personRow: { id: "person-1", household_id: "household-1" },
    ownerRow: { id: "member-1" },
    runRow: { id: "run-1", status: "ready" },
    resultRows: [],
  });

  const result = await handleConfirmReportResults({
    supabase,
    payload: { lab_report_id: "report-1" },
    userId: "user-1",
  });

  assert.equal(result.status, 400);
});

test("confirm_report_results marks report final and activates run results", async () => {
  const supabase = buildSupabase({
    reportRow: {
      id: "report-1",
      person_id: "person-1",
      current_extraction_run_id: "run-1",
    },
    personRow: { id: "person-1", household_id: "household-1" },
    ownerRow: { id: "member-1" },
    runRow: { id: "run-1", status: "ready" },
    resultRows: [
      {
        id: "row-1",
        name_raw: "Glucose",
        value_raw: "90",
        unit_raw: "mg/dL",
        value_num: 90,
        details_raw: null,
      },
    ],
  });

  const result = await handleConfirmReportResults({
    supabase,
    payload: { lab_report_id: "report-1" },
    userId: "user-1",
    now: () => "2024-01-01T00:00:00Z",
  });

  assert.equal(result.status, 200);
  const reportUpdate = supabase._calls.updateCalls.find(
    (call) => call.table === "lab_reports",
  );
  assert.equal(reportUpdate.payload.status, "final");
});
