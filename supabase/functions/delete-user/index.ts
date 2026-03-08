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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      throw new Error("Hanya admin yang bisa menghapus user");
    }

    const { user_id } = await req.json();
    if (!user_id) throw new Error("user_id harus diisi");
    if (user_id === caller.id) throw new Error("Tidak bisa menghapus akun sendiri");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Update profile status to deleted
    await adminClient
      .from("profiles")
      .update({ status: "deleted" })
      .eq("id", user_id);

    // Disable the auth user (ban)
    const { error: banError } = await adminClient.auth.admin.updateUserById(user_id, {
      ban_duration: "876600h", // ~100 years
    });
    if (banError) throw banError;

    return new Response(
      JSON.stringify({ message: "User berhasil dihapus" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
