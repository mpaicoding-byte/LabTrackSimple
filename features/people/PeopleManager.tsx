"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, User, Pencil, Trash2, X, Check } from "lucide-react";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LoadingState } from "@/components/ui/loading-state";

type PersonRow = {
  id: string;
  name: string;
  date_of_birth: string | null;
  gender: "female" | "male" | null;
  created_at: string;
};

const genderOptions = [
  { value: "", label: "Select gender" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

const formatGender = (value: string | null) => {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const wrapWithBoundary = (content: React.ReactNode) => (
  <ErrorBoundary>{content}</ErrorBoundary>
);

export const PeopleManager = () => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { session, loading: sessionLoading } = useSession();

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Mode
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDob, setNewDob] = useState("");
  const [newGender, setNewGender] = useState("");

  // Edit Mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");

  const canCreate =
    newName.trim().length > 0 &&
    newDob.trim().length > 0 &&
    (newGender === "female" || newGender === "male");


  const loadData = useCallback(async () => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const { data: memberData } = await supabase
        .from("household_members")
        .select("household_id, role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (memberData) {
        setHouseholdId(memberData.household_id);
        setRole(memberData.role);

        const { data: peopleData } = await supabase
          .from("people")
          .select("*")
          .eq("household_id", memberData.household_id)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });

        setPeople(peopleData as PersonRow[] ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [session, supabase]);

  useEffect(() => {
    if (!sessionLoading) loadData();
  }, [sessionLoading, loadData]);

  const createPerson = async () => {
    if (!householdId || !canCreate) return;

    setLoading(true);
    const { error } = await supabase.from("people").insert({
      household_id: householdId,
      name: newName,
      date_of_birth: newDob || null,
      gender: newGender || null
    });

    if (!error) {
      setNewName("");
      setNewDob("");
      setNewGender("");
      setIsCreating(false);
      await loadData();
    }
    setLoading(false);
  };

  const renamePerson = async () => {
    if (!editingId || !editName) return;

    const { error } = await supabase
      .from("people")
      .update({
        name: editName,
        date_of_birth: editDob || null,
        gender: editGender || null
      })
      .eq("id", editingId);

    if (!error) {
      setEditingId(null);
      await loadData();
    }
  };

  const softDeletePerson = async (id: string) => {
    if (!confirm("Are you sure you want to remove this person?")) return;

    const { error } = await supabase
      .from("people")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) await loadData();
  };

  const startEdit = (p: PersonRow) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDob(p.date_of_birth ?? "");
    setEditGender(p.gender ?? "");
  };

  if (!sessionLoading && !session) {
    return wrapWithBoundary(
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="bg-muted p-4 rounded-full">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Please Sign In</h2>
          <p className="text-muted-foreground max-w-sm text-center">
            You need to be signed in to manage your household members.
          </p>
          <Button asChild>
            <a href="/auth">Go to Sign In</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading && people.length === 0) {
    return wrapWithBoundary(
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <LoadingState />
        </div>
      </DashboardLayout>
    );
  }

  // Create Mode
  if (isCreating) {
    return wrapWithBoundary(
      <DashboardLayout>
        <div className="mx-auto max-w-2xl animate-in fade-in zoom-in-95 duration-300">
          <Card>
            <CardHeader className="border-b pb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Add Family Member
              </h2>
              <p className="text-muted-foreground">
                Add a new person to track reports for.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="md:grid md:grid-cols-2 gap-6 space-y-4 md:space-y-0">
                  <div className="space-y-2">
                    <label htmlFor="person-name" className="text-sm font-medium">Full Name</label>
                    <Input
                      id="person-name"
                      placeholder="e.g. Grandma Mae"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="person-dob" className="text-sm font-medium">Date of Birth</label>
                    <Input
                      id="person-dob"
                      type="date"
                      value={newDob}
                      onChange={e => setNewDob(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="person-gender" className="text-sm font-medium">Gender</label>
                  <select
                    id="person-gender"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={newGender}
                    onChange={e => setNewGender(e.target.value)}
                  >
                    {genderOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button onClick={createPerson} disabled={loading || !canCreate}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Person"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  // List Mode
  return wrapWithBoundary(
    <DashboardLayout>
      <div className="flex flex-col gap-8 relative z-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Family</h1>
            <p className="text-muted-foreground text-lg">Manage the people you care for.</p>
          </div>
          {role === 'owner' && (
            <Button
              onClick={() => setIsCreating(true)}
              disabled={isCreating}
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Family Member
            </Button>
          )}
        </div>

        {/* List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {people.map(person => (
            <Card key={person.id} className="group overflow-hidden">
              <div className="p-6 flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground border border-border">
                    <User className="h-7 w-7" />
                  </div>
                  {role === 'owner' && editingId !== person.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(person)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => softDeletePerson(person.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {editingId === person.id ? (
                  <div className="space-y-4 animate-in fade-in">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} />
                    <Input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={renamePerson}><Check className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-xl text-foreground mb-1">{person.name}</h3>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                        {person.date_of_birth ? new Date(person.date_of_birth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "DOB Unknown"}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                        {formatGender(person.gender)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {/* Empty State Card if no people */}
          {people.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-3xl bg-muted/30">
              <p className="text-muted-foreground">No family members added yet.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
