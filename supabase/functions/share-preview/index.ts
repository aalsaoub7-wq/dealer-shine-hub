import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!token) return new Response("Missing token", { status: 400 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: col } = await supabase
      .from("shared_collections")
      .select("title, photo_ids, landing_page_description")
      .eq("share_token", token)
      .maybeSingle();

    if (!col) return new Response("Not found", { status: 404 });

    let ogImage = "";
    if (col.photo_ids?.length) {
      const { data: p } = await supabase
        .from("photos")
        .select("url")
        .eq("id", col.photo_ids[0])
        .maybeSingle();
      if (p?.url) ogImage = p.url;
    }

    const title = col.title || "Bilder";
    const desc = col.landing_page_description || "Se bilderna här";
    const dest = `https://j8h8hienf8b3nfhbv.lovable.app/shared/${token}`;

    return new Response(
      `<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8"><title>${esc(title)}</title><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(ogImage)}"><meta property="og:type" content="website"><meta property="og:url" content="${esc(dest)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:image" content="${esc(ogImage)}"><script>window.location.replace("${dest}")</script></head><body><p>Omdirigerar…</p></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders } }
    );
  } catch (e) {
    console.error("share-preview error:", e);
    return new Response("Internal error", { status: 500 });
  }
});
