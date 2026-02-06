import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {
  return new Response("share-preview works", { status: 200 });
});
