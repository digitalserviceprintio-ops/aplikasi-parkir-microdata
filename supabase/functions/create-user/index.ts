import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Check caller's role using their token
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", (await callerClient.auth.getUser()).data.user?.id ?? "")
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      throw new Error("Hanya admin yang bisa membuat user baru");
    }

    const { email, password, name, role } = await req.json();

    if (!email || !password || !name) {
      throw new Error("Email, password, dan nama harus diisi");
    }

    // Create user with service role (bypasses email confirmation)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: role || "kasir" },
    });

    if (createError) throw createError;

    return new Response(
      JSON.stringify({ user: newUser.user, message: "User berhasil dibuat" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
