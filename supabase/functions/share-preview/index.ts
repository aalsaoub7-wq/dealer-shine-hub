const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const title = "Test Title";
    const desc = "Test description";
    const ogImage = "";
    const dest = "https://j8h8hienf8b3nfhbv.lovable.app/shared/" + token;

    const html = [
      "<!DOCTYPE html>",
      '<html lang="sv">',
      "<head>",
      '<meta charset="utf-8">',
      "<title>" + esc(title) + "</title>",
      '<meta property="og:title" content="' + esc(title) + '">',
      '<meta property="og:description" content="' + esc(desc) + '">',
      '<meta property="og:image" content="' + esc(ogImage) + '">',
      '<meta property="og:type" content="website">',
      '<meta property="og:url" content="' + esc(dest) + '">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:title" content="' + esc(title) + '">',
      '<meta name="twitter:image" content="' + esc(ogImage) + '">',
      "</head>",
      "<body><p>Omdirigerar</p></body>",
      "</html>",
    ].join("\n");

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
    });
  } catch (e) {
    console.error("share-preview error:", e);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
