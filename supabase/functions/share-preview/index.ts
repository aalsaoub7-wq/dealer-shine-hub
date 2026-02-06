Deno.serve(async (_req) => {
  return new Response(JSON.stringify({ version: "v2-test", ts: Date.now() }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
