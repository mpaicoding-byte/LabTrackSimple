export const handleConfirmReportResults = async ({
  supabase,
  payload,
  userId,
  now = () => new Date().toISOString(),
}) => {
  if (!userId) {
    return { status: 401, body: { error: "Unauthorized." } };
  }

  if (!payload?.lab_report_id) {
    return { status: 400, body: { error: "lab_report_id is required." } };
  }

  const { data: report, error: reportError } = await supabase
    .from("lab_reports")
    .select("id, person_id, current_extraction_run_id")
    .eq("id", payload.lab_report_id)
    .maybeSingle();

  if (reportError) {
    return { status: 500, body: { error: reportError.message } };
  }

  if (!report) {
    return { status: 404, body: { error: "Report not found." } };
  }

  if (!report.current_extraction_run_id) {
    return {
      status: 400,
      body: { error: "No extraction run is ready to confirm." },
    };
  }

  const { data: person, error: personError } = await supabase
    .from("people")
    .select("id, household_id")
    .eq("id", report.person_id)
    .maybeSingle();

  if (personError) {
    return { status: 500, body: { error: personError.message } };
  }

  if (!person) {
    return { status: 404, body: { error: "Person not found." } };
  }

  const { data: owner, error: ownerError } = await supabase
    .from("household_members")
    .select("id")
    .eq("user_id", userId)
    .eq("household_id", person.household_id)
    .eq("role", "owner")
    .maybeSingle();

  if (ownerError) {
    return { status: 500, body: { error: ownerError.message } };
  }

  if (!owner) {
    return { status: 403, body: { error: "Owner access required." } };
  }

  const runId = report.current_extraction_run_id;

  const { data: run, error: runError } = await supabase
    .from("extraction_runs")
    .select("id, status")
    .eq("id", runId)
    .maybeSingle();

  if (runError) {
    return { status: 500, body: { error: runError.message } };
  }

  if (!run) {
    return { status: 404, body: { error: "Extraction run not found." } };
  }

  if (run.status === "failed") {
    return { status: 400, body: { error: "Extraction failed. Retry required." } };
  }

  const { data: resultRows, error: resultsError } = await supabase
    .from("lab_results")
    .select("id")
    .eq("lab_report_id", report.id)
    .eq("extraction_run_id", runId)
    .is("deleted_at", null);

  if (resultsError) {
    return { status: 500, body: { error: resultsError.message } };
  }

  if (!resultRows || resultRows.length === 0) {
    return { status: 400, body: { error: "No extracted rows to confirm." } };
  }

  const timestamp = now();

  const { error: deactivateError } = await supabase
    .from("lab_results")
    .update({ is_active: false })
    .eq("lab_report_id", report.id)
    .neq("extraction_run_id", runId)
    .is("deleted_at", null);

  if (deactivateError) {
    return { status: 500, body: { error: deactivateError.message } };
  }

  const { error: activateError } = await supabase
    .from("lab_results")
    .update({ is_active: true, is_final: true })
    .eq("lab_report_id", report.id)
    .eq("extraction_run_id", runId)
    .is("deleted_at", null);

  if (activateError) {
    return { status: 500, body: { error: activateError.message } };
  }

  const { error: runUpdateError } = await supabase
    .from("extraction_runs")
    .update({ status: "confirmed", completed_at: timestamp })
    .eq("id", runId);

  if (runUpdateError) {
    return { status: 500, body: { error: runUpdateError.message } };
  }

  const { error: reportUpdateError } = await supabase
    .from("lab_reports")
    .update({
      status: "final",
      final_extraction_run_id: runId,
      confirmed_at: timestamp,
      confirmed_by: userId,
    })
    .eq("id", report.id);

  if (reportUpdateError) {
    return { status: 500, body: { error: reportUpdateError.message } };
  }

  return {
    status: 200,
    body: {
      lab_report_id: report.id,
      extraction_run_id: runId,
      status: "final",
      confirmed_at: timestamp,
      confirmed_rows: resultRows.length,
    },
  };
};
