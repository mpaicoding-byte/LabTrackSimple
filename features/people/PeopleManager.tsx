"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, User, Pencil, Trash2, X, Check } from "lucide-react";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

  const handleCreate = async () => {
    if (!householdId || !newName) return;

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

  const handleUpdate = async () => {
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

  const handleSoftDelete = async (id: string) => {
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
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="bg-indigo-50 p-4 rounded-full">
            <User className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold">Please Sign In</h2>
          <p className="text-slate-500 max-w-sm text-center">You need to be signed in to manage your household members.</p>
          <Button asChild>
            <a href="/auth">Go to Sign In</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading && people.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-zinc-300" />
        </div>
      </DashboardLayout>
    );
  }

  // Create Mode
  if (isCreating) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl animate-in fade-in zoom-in-95 duration-300">
          <Card className="glass dark:bg-white/5 overflow-hidden border-zinc-200 dark:border-white/10 shadow-2xl">
            <CardHeader className="border-b border-zinc-200 dark:border-white/5 pb-6">
              <CardTitle className="text-2xl font-display text-zinc-900 dark:text-white">Add Family Member</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">Add a new person to track reports for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="md:grid md:grid-cols-2 gap-6 space-y-4 md:space-y-0">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Full Name</label>
                    <Input
                      placeholder="e.g. Grandma Mae"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Date of Birth</label>
                    <Input
                      type="date"
                      value={newDob}
                      onChange={e => setNewDob(e.target.value)}
                      className="bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 h-10 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Gender</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
                      value={newGender}
                      onChange={e => setNewGender(e.target.value)}
                    >
                      {genderOptions.map(o => <option key={o.value} value={o.value} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">{o.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500 dark:text-zinc-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button variant="ghost" onClick={() => setIsCreating(false)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl">Cancel</Button>
                <Button onClick={handleCreate} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 rounded-xl px-6">
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
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 relative z-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white mb-2">My Family</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">Manage the people you care for.</p>
          </div>
          {role === 'owner' && (
            <Button
              onClick={() => setIsCreating(true)}
              disabled={isCreating}
              className="h-12 bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 text-indigo-600 dark:text-white border border-zinc-200 dark:border-white/10 hover:border-indigo-200 dark:hover:border-white/20 shadow-xl backdrop-blur-md rounded-xl px-6"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Family Member
            </Button>
          )}
        </div>

        {/* List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {people.map(person => (
            <Card key={person.id} className="group overflow-hidden bg-white/80 dark:bg-white/5 border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:border-indigo-200 dark:hover:border-white/20 transition-all duration-300 backdrop-blur-md hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 shadow-sm dark:shadow-none">
              <div className="p-6 flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 dark:from-indigo-500/20 to-purple-500/10 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-white/5 shadow-inner">
                    <User className="h-7 w-7" />
                  </div>
                  {role === 'owner' && editingId !== person.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(person)} className="h-8 w-8 text-zinc-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/10 rounded-lg">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleSoftDelete(person.id)} className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {editingId === person.id ? (
                  <div className="space-y-4 animate-in fade-in">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white h-9 rounded-lg" />
                    <Input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} className="bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white h-9 rounded-lg" />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={handleUpdate} className="bg-indigo-600 hover:bg-indigo-500 rounded-lg"><Check className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg"><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{person.name}</h3>
                    <div className="flex flex-col gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                        {person.date_of_birth ? new Date(person.date_of_birth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "DOB Unknown"}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
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
            <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-3xl bg-white/40 dark:bg-white/5">
              <p className="text-zinc-500">No family members added yet.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
