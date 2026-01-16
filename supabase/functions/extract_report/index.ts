import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let payload: { lab_report_id?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload." }, 400);
  }

  if (!payload.lab_report_id) {
    return jsonResponse({ error: "lab_report_id is required." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase environment variables." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const extractionRunId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    const { data: report, error: reportError } = await supabase
      .from("lab_reports")
      .select("id, person_id")
      .eq("id", payload.lab_report_id)
      .maybeSingle();

    if (reportError) throw reportError;
    if (!report) {
      return jsonResponse({ error: "Report not found." }, 404);
    }

    const { error: runInsertError } = await supabase
      .from("extraction_runs")
      .insert({
        id: extractionRunId,
        lab_report_id: report.id,
        status: "running",
        started_at: now,
      });

    if (runInsertError) throw runInsertError;

    const { data: artifacts, error: artifactsError } = await supabase
      .from("lab_artifacts")
      .select("id, object_path")
      .eq("lab_report_id", payload.lab_report_id)
      .eq("status", "ready")
      .is("deleted_at", null);

    if (artifactsError) throw artifactsError;

    const rows = (artifacts ?? []).map((artifact, index) => ({
      lab_report_id: payload.lab_report_id,
      person_id: report.person_id,
      extraction_run_id: extractionRunId,
      name_raw: `Artifact ${index + 1}`,
      value_raw: "Review artifact",
      unit_raw: null,
      value_num: null,
      details_raw: artifact.object_path,
    }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("lab_results")
        .insert(rows);

      if (insertError) throw insertError;
    }

    const { error: runUpdateError } = await supabase
      .from("extraction_runs")
      .update({ status: "ready", completed_at: now })
      .eq("id", extractionRunId);

    if (runUpdateError) throw runUpdateError;

    const { error: updateError } = await supabase
      .from("lab_reports")
      .update({
        status: "review_required",
        current_extraction_run_id: extractionRunId,
      })
      .eq("id", payload.lab_report_id);

    if (updateError) throw updateError;

    console.log(
      `[extract_report] run=${extractionRunId} report=${payload.lab_report_id} artifacts=${artifacts?.length ?? 0} status=review_required`,
    );

    return jsonResponse({
      extraction_run_id: extractionRunId,
      inserted_rows: rows.length,
      status: "review_required",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extraction failed.";

    await supabase
      .from("extraction_runs")
      .update({ status: "failed", completed_at: now, error: message })
      .eq("id", extractionRunId);

    await supabase
      .from("lab_reports")
      .update({ status: "extraction_failed" })
      .eq("id", payload.lab_report_id);

    console.error(
      `[extract_report] run=${extractionRunId} report=${payload.lab_report_id} status=extraction_failed error=${message}`,
    );

    return jsonResponse(
      {
        error: message,
        extraction_run_id: extractionRunId,
        status: "extraction_failed",
      },
      500,
    );
  }
});
