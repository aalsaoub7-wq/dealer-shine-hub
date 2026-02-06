import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response("Missing token", { status: 400, headers: corsHeaders });
    }

    console.log("share-preview: token", token);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fetchHeaders = { apikey: key, Authorization: "Bearer " + key };

    const colRes = await fetch(
      supabaseUrl + "/rest/v1/shared_collections?share_token=eq." + encodeURIComponent(token) + "&select=title,photo_ids,landing_page_description&limit=1",
      { headers: fetchHeaders }
    );
    const cols = await colRes.json();
    const col = cols && cols[0];
    if (!col) {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    let ogImage = "";
    if (col.photo_ids && col.photo_ids.length > 0) {
      const pRes = await fetch(
        supabaseUrl + "/rest/v1/photos?id=eq." + encodeURIComponent(col.photo_ids[0]) + "&select=url&limit=1",
        { headers: fetchHeaders }
      );
      const photos = await pRes.json();
      if (photos && photos[0] && photos[0].url) ogImage = photos[0].url;
    }

    const title = col.title || "Bilder";
    const desc = col.landing_page_description || "Se bilderna har";
    const dest = "https://j8h8hienf8b3nfhbv.lovable.app/shared/" + token;

    const html = '<!DOCTYPE html>\n<html lang="sv">\n<head>\n<meta charset="utf-8">\n<title>' + esc(title) + '</title>\n<meta property="og:title" content="' + esc(title) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n<meta property="og:image" content="' + esc(ogImage) + '">\n<meta property="og:type" content="website">\n<meta property="og:url" content="' + esc(dest) + '">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="' + esc(title) + '">\n<meta name="twitter:image" content="' + esc(ogImage) + '">\n<script>window.location.replace("' + dest + '")</script>\n</head>\n<body><p>Omdirigerar...</p></body>\n</html>';

    console.log("share-preview: returning HTML for token", token, "title:", title);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (e) {
    console.error("share-preview error:", e);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
