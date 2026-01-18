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

test.describe("trends family tabs", () => {
  test("filters results by family member", async ({ page }) => {
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
    const personAName = `Trends Avery ${runId}`;
    const personBName = `Trends Jordan ${runId}`;
    const personCName = `Trends Quinn ${runId}`;

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
        {
          household_id: householdId,
          name: personCName,
          date_of_birth: "1994-01-01",
          gender: "female",
        },
      ])
      .select("id, name");

    if (peopleError) {
      throw new Error(`Unable to create people rows: ${peopleError.message}`);
    }

    const personA = peopleData?.find((person) => person.name === personAName);
    const personB = peopleData?.find((person) => person.name === personBName);

    if (!personA || !personB) {
      throw new Error("Unable to resolve people IDs for trends test.");
    }

    const { data: reportsData, error: reportsError } = await admin
      .from("lab_reports")
      .insert([
        {
          household_id: householdId,
          person_id: personA.id,
          report_date: "2025-01-10",
          source: "E2E Trends",
          status: "final",
        },
        {
          household_id: householdId,
          person_id: personB.id,
          report_date: "2025-01-11",
          source: "E2E Trends",
          status: "final",
        },
      ])
      .select("id, person_id");

    if (reportsError) {
      throw new Error(`Unable to create lab reports: ${reportsError.message}`);
    }

    const reportA = reportsData?.find((report) => report.person_id === personA.id);
    const reportB = reportsData?.find((report) => report.person_id === personB.id);

    if (!reportA || !reportB) {
      throw new Error("Unable to resolve report IDs for trends test.");
    }

    const { data: runsData, error: runsError } = await admin
      .from("extraction_runs")
      .insert([
        { lab_report_id: reportA.id, status: "confirmed" },
        { lab_report_id: reportB.id, status: "confirmed" },
      ])
      .select("id, lab_report_id");

    if (runsError) {
      throw new Error(`Unable to create extraction runs: ${runsError.message}`);
    }

    const runA = runsData?.find((run) => run.lab_report_id === reportA.id);
    const runB = runsData?.find((run) => run.lab_report_id === reportB.id);

    if (!runA || !runB) {
      throw new Error("Unable to resolve extraction run IDs for trends test.");
    }

    await admin
      .from("lab_reports")
      .update({
        current_extraction_run_id: runA.id,
        final_extraction_run_id: runA.id,
      })
      .eq("id", reportA.id);

    await admin
      .from("lab_reports")
      .update({
        current_extraction_run_id: runB.id,
        final_extraction_run_id: runB.id,
      })
      .eq("id", reportB.id);

    const testAName = `Glucose E2E ${runId}`;
    const testBName = `Sodium E2E ${runId}`;

    const { error: resultsError } = await admin.from("lab_results").insert([
      {
        lab_report_id: reportA.id,
        person_id: personA.id,
        extraction_run_id: runA.id,
        name_raw: testAName,
        value_raw: "90",
        value_num: 90,
        unit_raw: "mg/dL",
        is_final: true,
        is_active: true,
      },
      {
        lab_report_id: reportB.id,
        person_id: personB.id,
        extraction_run_id: runB.id,
        name_raw: testBName,
        value_raw: "135",
        value_num: 135,
        unit_raw: "mmol/L",
        is_final: true,
        is_active: true,
      },
    ]);

    if (resultsError) {
      throw new Error(`Unable to create lab results: ${resultsError.message}`);
    }

    await page.goto("/trends");
    await expect(page.getByRole("heading", { name: /trends/i })).toBeVisible();

    await expect(page.getByRole("tab", { name: /all family/i })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: new RegExp(personCName, "i") })).toHaveCount(0);
    await page.getByRole("tab", { name: new RegExp(personAName, "i") }).click();

    await expect(page.getByText(testAName)).toBeVisible();
    await expect(page.getByText(testBName)).not.toBeVisible();
  });
});
