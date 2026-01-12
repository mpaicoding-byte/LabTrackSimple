"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";

type PersonRow = {
  id: string;
  name: string;
  date_of_birth: string | null;
  gender: "female" | "male" | null;
  created_at: string;
  deleted_at: string | null;
};

type Status = {
  type: "idle" | "loading" | "error" | "success";
  message: string;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const genderOptions = [
  { value: "", label: "Select gender" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

const formatGender = (value: "female" | "male") =>
  value === "female" ? "Female" : "Male";

export const PeopleManager = () => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { session, loading } = useSession();
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [newName, setNewName] = useState("");
  const [newDateOfBirth, setNewDateOfBirth] = useState("");
  const [newGender, setNewGender] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDateOfBirth, setEditingDateOfBirth] = useState("");
  const [editingGender, setEditingGender] = useState("");
  const [status, setStatus] = useState<Status>({
    type: "idle",
    message: "",
  });

  const loadMembership = useCallback(async () => {
    if (!session) {
      return;
    }

    setStatus({ type: "loading", message: "Loading household..." });
    const { data, error } = await supabase
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", session.user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    setHouseholdId(data?.household_id ?? null);
    setRole(data?.role ?? null);
    setStatus({ type: "idle", message: "" });
  }, [session, supabase]);

  const loadPeople = useCallback(
    async (targetHouseholdId: string) => {
      setStatus({ type: "loading", message: "Loading people..." });

      const { data, error } = await supabase
        .from("people")
        .select("id, name, date_of_birth, gender, created_at, deleted_at")
        .eq("household_id", targetHouseholdId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (error) {
        setStatus({ type: "error", message: error.message });
        return;
      }

      setPeople(data ?? []);
      setStatus({ type: "idle", message: "" });
    },
    [supabase],
  );

  useEffect(() => {
    if (!loading) {
      void loadMembership();
    }
  }, [loading, loadMembership]);

  useEffect(() => {
    if (householdId) {
      void loadPeople(householdId);
    }
  }, [householdId, loadPeople]);

  const createPerson = async () => {
    if (!householdId || !newName.trim() || !newDateOfBirth || !newGender) {
      return;
    }

    setStatus({ type: "loading", message: "Creating person..." });
    const { error } = await supabase.from("people").insert({
      household_id: householdId,
      name: newName.trim(),
      date_of_birth: newDateOfBirth || null,
      gender: newGender || null,
    });

    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    setNewName("");
    setNewDateOfBirth("");
    setNewGender("");
    await loadPeople(householdId);
    setStatus({ type: "success", message: "Person created." });
  };

  const renamePerson = async (
    personId: string,
    nextName: string,
    nextDateOfBirth: string,
    nextGender: string,
  ) => {
    if (!nextName.trim() || !nextDateOfBirth || !nextGender) {
      return;
    }

    setStatus({ type: "loading", message: "Saving changes..." });
    const { error } = await supabase
      .from("people")
      .update({
        name: nextName.trim(),
        date_of_birth: nextDateOfBirth || null,
        gender: nextGender || null,
      })
      .eq("id", personId);

    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    setEditingId(null);
    setEditingName("");
    setEditingDateOfBirth("");
    setEditingGender("");
    if (householdId) {
      await loadPeople(householdId);
    }
    setStatus({ type: "success", message: "Person updated." });
  };

  const softDeletePerson = async (personId: string) => {
    setStatus({ type: "loading", message: "Archiving person..." });
    const { error } = await supabase
      .from("people")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", personId);

    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    if (householdId) {
      await loadPeople(householdId);
    }
    setStatus({ type: "success", message: "Person archived." });
  };

  const canManage = role === "owner";
  const canCreate =
    canManage && newName.trim() && newDateOfBirth && newGender;

  return (
    <div className="min-h-screen bg-[conic-gradient(from_120deg_at_50%_0%,#fbf6e9,#f4efe4,#e7e5df,#f8f3ea)] text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:px-10">
        <header className="rounded-[28px] border border-slate-200/80 bg-white/70 p-8 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.6)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
            Household People
          </p>
          <h1 className="mt-3 font-display text-4xl text-slate-900">
            Keep profiles ready for reports.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Owners can add or rename profiles. Members only see their linked
            person record. Every profile stays scoped to the household.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1fr,1.1fr]">
          <div className="rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.6)] backdrop-blur">
            <h2 className="font-display text-2xl text-slate-900">
              Create a new person
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Add household members before uploading reports.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <input
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Full name"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                disabled={!canManage}
              />
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Date of birth
                <input
                  type="date"
                  value={newDateOfBirth}
                  onChange={(event) => setNewDateOfBirth(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-normal text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                  disabled={!canManage}
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Gender
                <select
                  value={newGender}
                  onChange={(event) => setNewGender(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-normal text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                  disabled={!canManage}
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={createPerson}
                disabled={!canCreate}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Add person
              </button>
              {!canManage ? (
                <p className="text-xs text-slate-500">
                  Only owners can create or edit people.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.6)] backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-slate-900">
                Current people
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {people.length} profiles
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {people.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No people yet. Create the first profile to begin.
                </p>
              ) : (
                people.map((person) => (
                  <div
                    key={person.id}
                    className="rounded-2xl border border-slate-200 bg-white/90 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {editingId === person.id ? (
                        <div className="flex flex-1 flex-col gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(event) =>
                              setEditingName(event.target.value)
                            }
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                          />
                          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Date of birth
                            <input
                              type="date"
                              value={editingDateOfBirth}
                              onChange={(event) =>
                                setEditingDateOfBirth(event.target.value)
                              }
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Gender
                            <select
                              value={editingGender}
                              onChange={(event) =>
                                setEditingGender(event.target.value)
                              }
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                            >
                              {genderOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {person.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Added {formatDate(person.created_at)}
                          </p>
                          {person.date_of_birth ? (
                            <p className="text-xs text-slate-500">
                              Born {formatDate(person.date_of_birth)}
                            </p>
                          ) : null}
                          {person.gender ? (
                            <p className="text-xs text-slate-500">
                              Gender {formatGender(person.gender)}
                            </p>
                          ) : (
                            <p className="text-xs text-amber-600">
                              Gender missing
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {editingId === person.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                renamePerson(
                                  person.id,
                                  editingName,
                                  editingDateOfBirth,
                                  editingGender,
                                )
                              }
                              className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                              disabled={
                                !canManage ||
                                !editingName.trim() ||
                                !editingDateOfBirth ||
                                !editingGender
                              }
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditingName("");
                                setEditingDateOfBirth("");
                                setEditingGender("");
                              }}
                              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(person.id);
                                setEditingName(person.name);
                                setEditingDateOfBirth(
                                  person.date_of_birth ?? "",
                                );
                                setEditingGender(person.gender ?? "");
                              }}
                              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                              disabled={!canManage}
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => softDeletePerson(person.id)}
                              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600"
                              disabled={!canManage}
                            >
                              Archive
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {status.message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              status.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {status.message}
          </div>
        ) : null}
      </div>
    </div>
  );
};
