import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migrationsDir = join(root, "supabase", "migrations");
const specsDir = join(root, "docs", "current specs", "reports-artifacts");

const files = {
  reportsPage: join(root, "app", "reports", "page.tsx"),
  reportsManager: join(root, "features", "reports", "ReportsManager.tsx"),
  storagePolicyDoc: join(specsDir, "reports_artifacts_storage_policy.md"),
};

const readMigrations = () => {
  assert.ok(existsSync(migrationsDir), "supabase/migrations should exist");

  const sqlFiles = readdirSync(migrationsDir).filter((file) =>
    file.endsWith(".sql"),
  );

  assert.ok(sqlFiles.length > 0, "Expected at least one SQL migration file");

  return sqlFiles
    .map((file) => readFileSync(join(migrationsDir, file), "utf8"))
    .join("\n");
};

const normalize = (sql) => sql.toLowerCase().replace(/\s+/g, " ");

test("Phase 3 report capture UI files exist", () => {
  assert.ok(existsSync(files.reportsPage), "Reports page missing");
  assert.ok(existsSync(files.reportsManager), "Reports manager component missing");
});

test("Phase 3 storage bucket and policies are defined", () => {
  const sql = normalize(readMigrations());

  assert.match(sql, /insert into storage\.buckets/, "Bucket insert missing");
  assert.match(sql, /lab-artifacts/, "Bucket id should be lab-artifacts");
  assert.match(
    sql,
    /create policy [^;]+ on storage\.objects/,
    "Storage objects policy missing",
  );
  assert.match(
    sql,
    /bucket_id = 'lab-artifacts'/,
    "Storage objects policy should scope to lab-artifacts",
  );
});

test("Phase 3 storage policy doc exists", () => {
  assert.ok(existsSync(files.storagePolicyDoc), "Storage policy doc missing");
});
