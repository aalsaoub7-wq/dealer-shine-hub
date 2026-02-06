import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string): string {
  return str
    .split("&").join("&amp;")
    .split('"').join("&quot;")
    .split("'").join("&#39;")
    .split("<").join("&lt;")
    .split(">").join("&gt;");
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      console.error("share-preview: missing env vars");
      return new Response("Server config error", { status: 500, headers: corsHeaders });
    }

    const dbHeaders = {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
    };

    // Fetch collection
    const colUrl = supabaseUrl + "/rest/v1/shared_collections?share_token=eq." + encodeURIComponent(token) + "&select=title,photo_ids,landing_page_description&limit=1";
    const colRes = await fetch(colUrl, { headers: dbHeaders });
    const cols = await colRes.json();

    if (!cols || !cols[0]) {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    const col = cols[0];

    // Fetch first photo for OG image
    let ogImage = "";
    if (col.photo_ids && col.photo_ids.length > 0) {
      const photoUrl = supabaseUrl + "/rest/v1/photos?id=eq." + encodeURIComponent(col.photo_ids[0]) + "&select=url&limit=1";
      const pRes = await fetch(photoUrl, { headers: dbHeaders });
      const photos = await pRes.json();
      if (photos && photos[0] && photos[0].url) {
        ogImage = photos[0].url;
      }
    }

    const title = col.title || "Bilder";
    const desc = col.landing_page_description || "Se bilderna har";
    const dest = "https://j8h8hienf8b3nfhbv.lovable.app/shared/" + token;

    const htmlParts = [
      "<!DOCTYPE html>",
      '<html lang="sv">',
      "<head>",
      '<meta charset="utf-8">',
      "<title>" + escapeHtml(title) + "</title>",
      '<meta property="og:title" content="' + escapeHtml(title) + '">',
      '<meta property="og:description" content="' + escapeHtml(desc) + '">',
      '<meta property="og:image" content="' + escapeHtml(ogImage) + '">',
      '<meta property="og:type" content="website">',
      '<meta property="og:url" content="' + escapeHtml(dest) + '">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:title" content="' + escapeHtml(title) + '">',
      '<meta name="twitter:image" content="' + escapeHtml(ogImage) + '">',
      '<script>window.location.replace("' + dest + '")</script>',
      "</head>",
      "<body><p>Omdirigerar...</p></body>",
      "</html>",
    ];

    const html = htmlParts.join("\n");

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
