import { createClient } from "jsr:@supabase/supabase-js@2";

import { handleConfirmReportResults } from "./handler.js";

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

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase environment variables." }, 500);
  }

  const supabaseAuth = createClient(supabaseUrl, serviceRoleKey, {
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });

  const { data: authData, error: authError } = await supabaseAuth.auth.getUser();

  if (authError) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  const userId = authData?.user?.id ?? null;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const result = await handleConfirmReportResults({
    supabase: supabaseAdmin,
    payload,
    userId,
  });

  if (result.status === 200) {
    console.log(
      `[confirm_report_results] report=${payload.lab_report_id} run=${result.body?.extraction_run_id ?? "unknown"} status=final`,
    );
  } else {
    console.error(
      `[confirm_report_results] report=${payload.lab_report_id ?? "unknown"} status=${result.status}`,
    );
  }

  return jsonResponse(result.body, result.status);
});
