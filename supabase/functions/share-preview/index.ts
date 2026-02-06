import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "none";
  return new Response("token=" + esc(token), { status: 200 });
});
