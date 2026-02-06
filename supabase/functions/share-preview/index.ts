Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  return new Response(JSON.stringify({ version: "v3-token", token, ts: Date.now() }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
