import type { SupabaseClient } from "@supabase/supabase-js";

export const ensureUserProfile = async (
  admin: SupabaseClient,
  userId: string,
  email: string,
) => {
  const { data: people, error: peopleError } = await admin
    .from("people")
    .select("id, household_id, date_of_birth, gender")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .limit(1);

  if (peopleError) {
    throw new Error(`Failed to read people row for ${email}: ${peopleError.message}`);
  }

  const person = people?.[0];
  let householdId = person?.household_id ?? null;

  if (!householdId) {
    const { data: household, error: householdError } = await admin
      .from("households")
      .insert({ owner_user_id: userId, name: "E2E Signin Household" })
      .select("id")
      .single();

    if (householdError || !household) {
      throw new Error(
        `Failed to create household for ${email}: ${householdError?.message ?? "unknown error"}`,
      );
    }

    householdId = household.id;
  }

  const { data: members, error: membersError } = await admin
    .from("household_members")
    .select("id")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .limit(1);

  if (membersError) {
    throw new Error(
      `Failed to read household membership for ${email}: ${membersError.message}`,
    );
  }

  if (!members?.length) {
    const { error: insertMemberError } = await admin
      .from("household_members")
      .insert({
        household_id: householdId,
        user_id: userId,
        role: "owner",
      });

    if (insertMemberError) {
      throw new Error(
        `Failed to create household membership for ${email}: ${insertMemberError.message}`,
      );
    }
  }

  if (!person) {
    const ownerName = email.split("@")[0] ?? "Owner";
    const { error: personError } = await admin.from("people").insert({
      household_id: householdId,
      user_id: userId,
      name: ownerName,
      date_of_birth: "1980-01-01",
      gender: "female",
    });

    if (personError) {
      throw new Error(`Failed to create profile for ${email}: ${personError.message}`);
    }

    return;
  }

  const updates: { date_of_birth?: string; gender?: string } = {};
  if (!person.date_of_birth) {
    updates.date_of_birth = "1980-01-01";
  }
  if (!person.gender) {
    updates.gender = "female";
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  const { error: updateError } = await admin
    .from("people")
    .update(updates)
    .eq("id", person.id);

  if (updateError) {
    throw new Error(`Failed to update profile for ${email}: ${updateError.message}`);
  }
};
