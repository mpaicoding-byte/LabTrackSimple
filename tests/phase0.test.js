import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

test("Phase 0 metadata uses LabTrackSimple branding", () => {
  const layout = readFileSync(join(root, "app", "layout.tsx"), "utf8");

  assert.match(layout, /title:\s*["'`]LabTrackSimple["'`]/);
  assert.match(layout, /description:\s*["'`].*LabTrackSimple.*["'`]/);
});

test("Home page placeholder mentions LabTrackSimple", () => {
  const page = readFileSync(join(root, "app", "page.tsx"), "utf8");

  assert.match(page, /LabTrackSimple/);
  assert.ok(!page.includes("Create Next App"));
});

test("App Router special files exist", () => {
  const requiredFiles = ["loading.tsx", "error.tsx", "not-found.tsx"];

  for (const filename of requiredFiles) {
    const fullPath = join(root, "app", filename);
    assert.ok(existsSync(fullPath), `${filename} should exist`);
  }
});

test("Phase 0 package.json declares module type", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

  assert.equal(pkg.type, "module");
});
