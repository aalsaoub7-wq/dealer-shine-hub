import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch shared collection
    const { data: collection, error: collError } = await supabase
      .from("shared_collections")
      .select(
        "title, photo_ids, landing_page_description, landing_page_logo_url"
      )
      .eq("share_token", token)
      .maybeSingle();

    if (collError) {
      console.error("DB error:", collError);
      return new Response("Server error", { status: 500 });
    }

    if (!collection) {
      return new Response("Not found", { status: 404 });
    }

    // Get the first photo URL for og:image
    let ogImage = "";
    if (collection.photo_ids && collection.photo_ids.length > 0) {
      const firstPhotoId = collection.photo_ids[0];
      const { data: photo } = await supabase
        .from("photos")
        .select("url")
        .eq("id", firstPhotoId)
        .maybeSingle();

      if (photo?.url) {
        ogImage = photo.url;
      }
    }

    const ogTitle = collection.title || "Bilder";
    const ogDescription =
      collection.landing_page_description || "Se bilderna här";

    // Build the frontend URL the user should land on
    const siteOrigin = supabaseUrl.replace(
      ".supabase.co",
      ".lovable.app"
    );
    // Use the published app URL directly
    const frontendUrl = `https://j8h8hienf8b3nfhbv.lovable.app/shared/${token}`;

    const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(ogTitle)}</title>
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(ogDescription)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(frontendUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  <script>window.location.replace("${frontendUrl}");</script>
</head>
<body>
  <p>Omdirigerar...</p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("share-preview error:", err);
    return new Response("Internal error", { status: 500 });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
