import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const scriptPath = join(root, "scripts", "supabase_push.sh");
const examplePath = join(root, ".env.supabase.example");

test("Supabase CLI helper script exists with required commands", () => {
  assert.ok(existsSync(scriptPath), "supabase_push.sh should exist");

  const script = readFileSync(scriptPath, "utf8");
  assert.match(script, /source "?\.env"?/);
  assert.match(script, /supabase@latest link/);
  assert.match(script, /supabase@latest db push/);
  assert.match(script, /supabase@latest secrets set/);
});

test("Supabase secrets example file exists", () => {
  assert.ok(existsSync(examplePath), ".env.supabase.example should exist");

  const example = readFileSync(examplePath, "utf8");
  assert.match(example, /OPENAI_API_KEY=/);
});
