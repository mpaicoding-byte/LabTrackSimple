"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Plus, User, Pencil, Trash2, X, Check, Calendar as CalendarIcon } from "lucide-react";

import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";
import { useSession } from "@/features/auth/SessionProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LoadingState } from "@/components/ui/loading-state";

type PersonRow = {
  id: string;
  name: string;
  date_of_birth: string | null;
  gender: "female" | "male" | null;
  created_at: string;
};

type CreatePersonFormValues = {
  name: string;
  dateOfBirth: string;
  gender: string;
};

const genderOptions = [
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

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: string) => {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`);
};

const formatDateLabel = (value: string) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Pick a date";

export const PeopleManager = () => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { session, loading: sessionLoading } = useSession();

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Mode
  const [isCreating, setIsCreating] = useState(false);
  const {
    control,
    handleSubmit,
    register,
    reset: resetCreateForm,
    formState: { errors, isSubmitting },
  } = useForm<CreatePersonFormValues>({
    defaultValues: {
      name: "",
      dateOfBirth: "",
      gender: "",
    },
    mode: "onSubmit",
  });

  // Edit Mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<PersonRow | null>(null);
  const [newDobOpen, setNewDobOpen] = useState(false);
  const [editDobOpen, setEditDobOpen] = useState(false);


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

  const handleCreatePerson = handleSubmit(async (values) => {
    if (!householdId) return;

    setLoading(true);
    const { error } = await supabase.from("people").insert({
      household_id: householdId,
      name: values.name.trim(),
      date_of_birth: values.dateOfBirth || null,
      gender: values.gender || null,
    });

    if (!error) {
      resetCreateForm();
      setNewDobOpen(false);
      setIsCreating(false);
      await loadData();
      toast.success("Family member added.");
    } else {
      toast.error(error.message ?? "Unable to add family member.");
    }
    setLoading(false);
  });

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
      toast.success("Family member updated.");
    } else {
      toast.error(error.message ?? "Unable to update family member.");
    }
  };

  const softDeletePerson = async (id: string) => {
    const { error } = await supabase
      .from("people")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      await loadData();
      toast.success("Family member removed.");
    } else {
      toast.error(error.message ?? "Unable to remove family member.");
    }
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
            <CardContent className="pt-6">
              <form className="space-y-6" onSubmit={handleCreatePerson}>
                <div className="space-y-4">
                  <div className="md:grid md:grid-cols-2 gap-6 space-y-4 md:space-y-0">
                    <div className="space-y-2">
                      <Label htmlFor="person-name">Full Name</Label>
                      <Input
                        id="person-name"
                        placeholder="e.g. Grandma Mae"
                        {...register("name", {
                          required: "Full name is required.",
                        })}
                      />
                      {errors.name?.message && (
                        <p className="text-xs font-medium text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="person-dob">Date of Birth</Label>
                      <Controller
                        control={control}
                        name="dateOfBirth"
                        rules={{ required: "Date of birth is required." }}
                        render={({ field }) => (
                          <Popover open={newDobOpen} onOpenChange={setNewDobOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                id="person-dob"
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formatDateLabel(field.value)}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={parseDateValue(field.value)}
                                onSelect={(date) => {
                                  field.onChange(date ? formatDateValue(date) : "");
                                  setNewDobOpen(false);
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                      {errors.dateOfBirth?.message && (
                        <p className="text-xs font-medium text-destructive">
                          {errors.dateOfBirth.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="person-gender">Gender</Label>
                    <Controller
                      control={control}
                      name="gender"
                      rules={{ required: "Gender is required." }}
                      render={({ field }) => {
                        const selectedLabel =
                          genderOptions.find((option) => option.value === field.value)
                            ?.label ?? "Select gender";
                        return (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="person-gender">
                              <SelectValue>{selectedLabel}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {genderOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      }}
                    />
                    {errors.gender?.message && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      resetCreateForm();
                      setNewDobOpen(false);
                      setIsCreating(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || isSubmitting}>
                    {loading || isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save Person"
                    )}
                  </Button>
                </div>
              </form>
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
                      <Button size="icon" variant="ghost" onClick={() => setDeleteCandidate(person)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {editingId === person.id ? (
                  <div className="space-y-4 animate-in fade-in">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} />
                    <Popover open={editDobOpen} onOpenChange={setEditDobOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formatDateLabel(editDob)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={parseDateValue(editDob)}
                          onSelect={(date) =>
                            {
                              setEditDob(date ? formatDateValue(date) : "");
                              setEditDobOpen(false);
                            }
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <Select value={editGender} onValueChange={setEditGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        {person.date_of_birth
                          ? new Date(`${person.date_of_birth}T00:00:00`).toLocaleDateString(
                              undefined,
                              { year: "numeric", month: "long", day: "numeric" },
                            )
                          : "DOB Unknown"}
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
        <AlertDialog
          open={Boolean(deleteCandidate)}
          onOpenChange={(open) => {
            if (!open) setDeleteCandidate(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove family member?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will remove the person from your household list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!deleteCandidate) return;
                  void softDeletePerson(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};
