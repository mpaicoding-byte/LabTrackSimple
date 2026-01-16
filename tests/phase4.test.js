import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const files = {
  edgeFunction: join(root, "supabase", "functions", "extract_report", "index.ts"),
  reportsManager: join(root, "features", "reports", "ReportsManager.tsx"),
};

const read = (path) => readFileSync(path, "utf8");

test("Phase 4 edge function exists", () => {
  assert.ok(
    existsSync(files.edgeFunction),
    "extract_report edge function missing",
  );
});

test("Phase 4 edge function writes results and updates report status/run", () => {
  assert.ok(
    existsSync(files.edgeFunction),
    "extract_report edge function missing",
  );
  const source = read(files.edgeFunction);

  assert.match(source, /extraction_run_id/, "extraction_run_id missing");
  assert.match(source, /extraction_runs/, "extraction_runs insert missing");
  assert.match(source, /lab_results/, "lab_results insert missing");
  assert.match(source, /lab_reports/, "report status update missing");
  assert.match(source, /current_extraction_run_id/, "current_extraction_run_id update missing");
  assert.match(source, /review_required/, "review_required update missing");
  assert.match(source, /extraction_failed/, "extraction_failed update missing");
});

test("Phase 4 UI can trigger extraction", () => {
  const source = read(files.reportsManager);

  assert.match(
    source,
    /functions\.invoke\(['"]extract_report['"]/,
    "extract_report invoke missing",
  );
});
