import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migrationsDir = join(root, "supabase", "migrations");
const typesFile = join(root, "features", "core", "types.ts");

const readMigrations = () => {
  assert.ok(existsSync(migrationsDir), "supabase/migrations should exist");

  const files = readdirSync(migrationsDir).filter((file) =>
    file.endsWith(".sql"),
  );

  assert.ok(files.length > 0, "Expected at least one SQL migration file");

  return files
    .map((file) => readFileSync(join(migrationsDir, file), "utf8"))
    .join("\n");
};

const normalize = (sql) => sql.toLowerCase().replace(/\s+/g, " ");

test("Phase 1 migrations define core tables", () => {
  const sql = normalize(readMigrations());
  const tables = [
    "households",
    "household_members",
    "people",
    "lab_reports",
    "lab_artifacts",
    "lab_results_staging",
    "lab_results",
  ];

  for (const table of tables) {
    assert.match(
      sql,
      new RegExp(`create table if not exists ${table}`),
      `Missing table: ${table}`,
    );
  }
});

test("Phase 1 constraints and indexes exist", () => {
  const sql = normalize(readMigrations());

  assert.ok(
    sql.includes(
      "check (status in ('draft','review_required','final','extraction_failed'))",
    ),
    "lab_reports status constraint missing",
  );
  assert.ok(
    sql.includes("check (status in ('pending','ready','failed'))"),
    "lab_artifacts status constraint missing",
  );
  assert.ok(
    sql.includes("check (status in ('needs_review','approved','rejected'))"),
    "lab_results_staging status constraint missing",
  );

  assert.ok(
    sql.includes("household_members_unique_user"),
    "household_members unique constraint missing",
  );
  assert.ok(
    sql.includes("household_members_single_owner"),
    "household_members single-owner constraint missing",
  );
  assert.ok(
    sql.includes("people_unique_user"),
    "people unique user constraint missing",
  );

  const indexes = [
    "lab_results_household_person_name_idx",
    "lab_results_report_idx",
    "lab_results_household_name_idx",
    "lab_results_staging_run_idx",
    "lab_results_staging_report_idx",
  ];

  for (const index of indexes) {
    assert.ok(sql.includes(index), `Missing index: ${index}`);
  }
});

test("Phase 1 RLS is enabled with policies per table", () => {
  const sql = normalize(readMigrations());
  const tables = [
    "households",
    "household_members",
    "people",
    "lab_reports",
    "lab_artifacts",
    "lab_results_staging",
    "lab_results",
  ];

  for (const table of tables) {
    assert.ok(
      sql.includes(`alter table ${table} enable row level security`),
      `RLS not enabled for ${table}`,
    );
    assert.ok(
      new RegExp(`create policy [^;]+ on ${table}`).test(sql),
      `Missing policies for ${table}`,
    );
  }

  for (const table of tables) {
    assert.ok(
      new RegExp(`on ${table}[^;]+deleted_at is null`).test(sql),
      `Soft-delete filter missing in policies for ${table}`,
    );
  }
});

test("Phase 1 shared types align with schema", () => {
  assert.ok(existsSync(typesFile), "Core types file missing");

  const types = readFileSync(typesFile, "utf8");
  const requiredTypes = [
    "export type Household",
    "export type HouseholdMember",
    "export type Person",
    "export type LabReport",
    "export type LabArtifact",
    "export type LabResultStaging",
    "export type LabResult",
  ];

  for (const typeName of requiredTypes) {
    assert.ok(types.includes(typeName), `Missing type: ${typeName}`);
  }
});
