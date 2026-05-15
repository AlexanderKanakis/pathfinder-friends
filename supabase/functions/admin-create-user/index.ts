import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async request => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = getServiceRoleKey();
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Server is not configured" }, 500);
  }

  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return json({ error: "Missing authorization" }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  const caller = userData?.user;
  if (userError || !caller) {
    return json({ error: "Invalid authorization" }, 401);
  }

  const { data: adminRow, error: adminError } = await adminClient
    .from("app_admins")
    .select("user_id")
    .eq("user_id", caller.id)
    .maybeSingle();

  if (adminError) {
    return json({ error: "Could not verify admin access" }, 500);
  }

  if (!adminRow) {
    return json({ error: "Admin access required" }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password || password.length < 6) {
    return json({ error: "Email and a password of at least 6 characters are required" }, 400);
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    return json({ error: error.message }, 400);
  }

  return json({ id: data.user?.id, email: data.user?.email });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function getServiceRoleKey() {
  const custom = Deno.env.get("ADMIN_SERVICE_ROLE_KEY");
  if (custom) return custom;

  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;

  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!secretKeys) return "";

  try {
    const parsed = JSON.parse(secretKeys);
    return parsed.service_role || parsed.serviceRole || parsed.default || Object.values(parsed)[0] || "";
  } catch {
    return "";
  }
}
