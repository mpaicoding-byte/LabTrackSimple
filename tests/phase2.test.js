import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migrationsDir = join(root, "supabase", "migrations");
const envExample = join(root, ".env.example");

const files = {
  authPage: join(root, "app", "auth", "page.tsx"),
  peoplePage: join(root, "app", "people", "page.tsx"),
  supabaseClient: join(root, "features", "core", "supabaseClient.ts"),
  sessionProvider: join(root, "features", "auth", "SessionProvider.tsx"),
  authScreen: join(root, "features", "auth", "AuthScreen.tsx"),
  peopleManager: join(root, "features", "people", "PeopleManager.tsx"),
};

const read = (path) => readFileSync(path, "utf8");

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

test("Phase 2 environment example documents Supabase keys", () => {
  assert.ok(existsSync(envExample), ".env.example should exist");
  const env = read(envExample);

  assert.match(env, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(env, /NEXT_PUBLIC_SUPABASE_ANON_KEY=/);
});

test("Phase 2 Supabase client and session provider are defined", () => {
  assert.ok(existsSync(files.supabaseClient), "Supabase client file missing");
  assert.ok(existsSync(files.sessionProvider), "Session provider file missing");

  const supabaseClient = read(files.supabaseClient);
  assert.match(supabaseClient, /createClient/);
  assert.match(supabaseClient, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(supabaseClient, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);

  const sessionProvider = read(files.sessionProvider);
  assert.match(sessionProvider, /useSession/);
  assert.match(sessionProvider, /onAuthStateChange/);
});

test("Phase 2 auth flow UI entry points exist", () => {
  assert.ok(existsSync(files.authPage), "Auth page missing");
  assert.ok(existsSync(files.authScreen), "Auth screen component missing");

  const authPage = read(files.authPage);
  assert.match(authPage, /AuthScreen/);

  const authScreen = read(files.authScreen);
  assert.match(authScreen, /signIn/);
  assert.match(authScreen, /signUp/);
});

test("Phase 2 people management UI exists", () => {
  assert.ok(existsSync(files.peoplePage), "People page missing");
  assert.ok(existsSync(files.peopleManager), "People manager component missing");

  const peopleManager = read(files.peopleManager);
  assert.match(peopleManager, /createPerson/);
  assert.match(peopleManager, /renamePerson/);
  assert.match(peopleManager, /softDeletePerson/);
});

test("Phase 2 signup bootstrap runs in the database", () => {
  const sql = readMigrations().toLowerCase().replace(/\s+/g, " ");

  assert.match(sql, /create or replace function public\.handle_new_user/);
  assert.match(sql, /insert into public\.households/);
  assert.match(sql, /insert into public\.household_members/);
  assert.match(sql, /insert into public\.people/);
  assert.match(sql, /create trigger on_auth_user_created/);
  assert.match(sql, /after insert on auth\.users/);
});
