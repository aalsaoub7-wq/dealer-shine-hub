import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "none";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "missing";
  return new Response("token=" + token + " url=" + supabaseUrl, { status: 200 });
});
