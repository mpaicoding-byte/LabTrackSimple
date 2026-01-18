import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { ensureUserProfile } from "./ensureUserProfile";

const requireCredentials = () => {
  if (!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD) {
    test.skip(true, "Set E2E_EMAIL and E2E_PASSWORD in .env.");
  }
};

const getAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "http://127.0.0.1:54321";

  test.skip(!serviceKey, "Set SUPABASE_SERVICE_ROLE_KEY for local Supabase.");

  return createClient(supabaseUrl, serviceKey ?? "", {
    auth: { persistSession: false },
  });
};

const findUserId = async (admin: ReturnType<typeof createClient>, email: string) => {
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    throw new Error(`Unable to fetch auth users: ${error.message}`);
  }

  const user = data.users.find((candidate) => candidate.email === email);
  if (!user) {
    throw new Error(`Unable to find auth user for ${email}.`);
  }

  return user.id;
};

test.describe("reports family tabs", () => {
  test("filters reports by family member", async ({ page }) => {
    requireCredentials();
    const admin = getAdminClient();
    const email = process.env.E2E_EMAIL ?? "";

    const userId = await findUserId(admin, email);
    await ensureUserProfile(admin, userId, email);

    const { data: memberData, error: memberError } = await admin
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (memberError) {
      throw new Error(`Unable to load household membership: ${memberError.message}`);
    }

    const householdId = memberData?.household_id;
    expect(householdId).toBeTruthy();

    const runId = Date.now();
    const personAName = `Reports Ada ${runId}`;
    const personBName = `Reports Grace ${runId}`;

    const { data: peopleData, error: peopleError } = await admin
      .from("people")
      .insert([
        {
          household_id: householdId,
          name: personAName,
          date_of_birth: "1990-01-01",
          gender: "female",
        },
        {
          household_id: householdId,
          name: personBName,
          date_of_birth: "1992-01-01",
          gender: "male",
        },
      ])
      .select("id, name");

    if (peopleError) {
      throw new Error(`Unable to create people rows: ${peopleError.message}`);
    }

    const personA = peopleData?.find((person) => person.name === personAName);
    const personB = peopleData?.find((person) => person.name === personBName);

    if (!personA || !personB) {
      throw new Error("Unable to resolve people IDs for reports test.");
    }

    const { error: reportsError } = await admin
      .from("lab_reports")
      .insert([
        {
          household_id: householdId,
          person_id: personA.id,
          report_date: "2025-01-12",
          source: "E2E Reports",
          status: "final",
        },
        {
          household_id: householdId,
          person_id: personB.id,
          report_date: "2025-01-15",
          source: "E2E Reports",
          status: "review_required",
        },
      ]);

    if (reportsError) {
      throw new Error(`Unable to create lab reports: ${reportsError.message}`);
    }

    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: /lab reports/i })).toBeVisible();

    await expect(page.getByRole("tab", { name: /all family/i })).toBeVisible();
    await page.getByRole("tab", { name: new RegExp(personAName, "i") }).click();

    await expect(page.getByRole("heading", { name: new RegExp(personAName, "i") })).toBeVisible();
    await expect(page.getByRole("heading", { name: new RegExp(personBName, "i") })).not.toBeVisible();
  });
});
