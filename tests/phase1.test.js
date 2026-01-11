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
    "lab_results_person_name_idx",
    "lab_results_report_idx",
    "lab_results_name_idx",
    "lab_results_staging_run_idx",
    "lab_results_staging_report_idx",
  ];

  for (const index of indexes) {
    assert.ok(sql.includes(index), `Missing index: ${index}`);
  }
});

test("Phase 1 people include date of birth", () => {
  const sql = normalize(readMigrations());
  assert.ok(sql.includes("date_of_birth"), "people date_of_birth missing");
});

test("Phase 1 lab results no longer store household ids", () => {
  const sql = normalize(readMigrations());
  assert.ok(
    /alter table lab_results drop column (if exists )?household_id/.test(sql),
    "lab_results household_id drop missing",
  );
  assert.ok(
    /alter table lab_results_staging drop column (if exists )?household_id/.test(
      sql,
    ),
    "lab_results_staging household_id drop missing",
  );
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

test("Phase 1 household_members owner policy avoids recursion", () => {
  const sql = normalize(readMigrations());
  const policyRegex = /create policy "household_members_owner_access"[\s\S]*?;/g;
  const matches = sql.match(policyRegex);

  assert.ok(matches?.length, "household_members owner policy missing");

  const policyChunk = matches[matches.length - 1];

  assert.ok(
    policyChunk.includes("from households"),
    "household_members owner policy should use households table",
  );
  assert.ok(
    !policyChunk.includes("from household_members"),
    "household_members owner policy should not reference household_members",
  );
});

test("Phase 1 households policies avoid household_members recursion", () => {
  const sql = normalize(readMigrations());
  const policies = ["households_member_read", "households_owner_access"];

  for (const policy of policies) {
    const marker = `create policy \"${policy}\"`;
    const policyStart = sql.lastIndexOf(marker);

    assert.ok(policyStart !== -1, `households policy missing: ${policy}`);

    const rest = sql.slice(policyStart);
    const nextPolicy = rest.indexOf("create policy", marker.length);
    const policyChunk = nextPolicy === -1 ? rest : rest.slice(0, nextPolicy);

    assert.ok(
      !policyChunk.includes("from household_members"),
      `households policy should not reference household_members: ${policy}`,
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

  assert.ok(
    types.includes("date_of_birth"),
    "Person date_of_birth missing in types",
  );
});
