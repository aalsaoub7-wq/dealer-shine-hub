// Storage cleanup function — runs on a schedule to remove orphaned files.
// Rules:
//   - Transparent cache files (path contains '/transparent/' or starts with 'transparent/')
//     not referenced by any photos.transparent_url AND older than 30 days → delete.
//   - Other car-photos files not referenced by photos.url, photos.original_url,
//     photos.pre_watermark_url or photos.interior_background_url AND older than 7 days → delete.
// Safety:
//   - Always excludes files created within the last 24h.
//   - Batches deletes (max 1000 per call) to stay within Supabase API limits.
//   - Idempotent: re-running is safe.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "car-photos";
const TRANSPARENT_AGE_DAYS = 30;
const ORPHAN_AGE_DAYS = 7;
const SAFETY_AGE_HOURS = 24;
const DELETE_BATCH_SIZE = 500;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const startedAt = Date.now();
  const result = {
    transparent_deleted: 0,
    orphan_deleted: 0,
    transparent_scanned: 0,
    orphan_scanned: 0,
    errors: [] as string[],
  };

  try {
    // Build set of all referenced storage paths from photos table.
    const referenced = new Set<string>();
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("photos")
        .select("url, original_url, transparent_url, pre_watermark_url, interior_background_url")
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`photos query: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const row of data) {
        for (const u of [
          row.url,
          row.original_url,
          row.transparent_url,
          row.pre_watermark_url,
          row.interior_background_url,
        ]) {
          if (typeof u === "string" && u.length > 0) {
            const path = extractStoragePath(u);
            if (path) referenced.add(path);
          }
        }
      }
      if (data.length < PAGE) break;
      from += PAGE;
    }

    const safetyCutoff = new Date(Date.now() - SAFETY_AGE_HOURS * 3600 * 1000);
    const transparentCutoff = new Date(Date.now() - TRANSPARENT_AGE_DAYS * 86400 * 1000);
    const orphanCutoff = new Date(Date.now() - ORPHAN_AGE_DAYS * 86400 * 1000);

    // Walk storage objects in pages by listing root and subfolders we know about.
    // We scan the bucket via storage.objects through the admin REST listing.
    const transparentDeletes: string[] = [];
    const orphanDeletes: string[] = [];

    // Use storage REST list (recursive walk) — supabase-js lists per folder.
    await walk(supabase, "", async (obj) => {
      if (!obj.name) return;
      const fullPath = obj.name;
      const created = obj.created_at ? new Date(obj.created_at) : null;
      if (!created || created > safetyCutoff) return;

      // Never delete logo files — they are referenced from ai_settings, not photos
      if (fullPath.startsWith("logos/")) return;

      const isTransparent = fullPath.includes("transparent");
      if (isTransparent) {
        result.transparent_scanned++;
        if (created < transparentCutoff && !referenced.has(fullPath)) {
          transparentDeletes.push(fullPath);
        }
      } else {
        result.orphan_scanned++;
        if (created < orphanCutoff && !referenced.has(fullPath)) {
          orphanDeletes.push(fullPath);
        }
      }
    });

    // Batch deletes
    for (let i = 0; i < transparentDeletes.length; i += DELETE_BATCH_SIZE) {
      const batch = transparentDeletes.slice(i, i + DELETE_BATCH_SIZE);
      const { error } = await supabase.storage.from(BUCKET).remove(batch);
      if (error) result.errors.push(`transparent batch: ${error.message}`);
      else result.transparent_deleted += batch.length;
    }
    for (let i = 0; i < orphanDeletes.length; i += DELETE_BATCH_SIZE) {
      const batch = orphanDeletes.slice(i, i + DELETE_BATCH_SIZE);
      const { error } = await supabase.storage.from(BUCKET).remove(batch);
      if (error) result.errors.push(`orphan batch: ${error.message}`);
      else result.orphan_deleted += batch.length;
    }

    const elapsed = Date.now() - startedAt;
    return new Response(
      JSON.stringify({ ok: true, elapsed_ms: elapsed, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e), ...result }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// Extract storage path from a public/sign URL like
// https://<ref>.supabase.co/storage/v1/object/public/car-photos/<path>
function extractStoragePath(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) {
    const m2 = `/object/sign/${BUCKET}/`;
    const j = url.indexOf(m2);
    if (j === -1) return null;
    let p = url.substring(j + m2.length);
    const q = p.indexOf("?");
    if (q !== -1) p = p.substring(0, q);
    return decodeURIComponent(p);
  }
  let p = url.substring(i + marker.length);
  const q = p.indexOf("?");
  if (q !== -1) p = p.substring(0, q);
  return decodeURIComponent(p);
}

// Recursive walk over storage bucket folders, calling cb for each file object.
async function walk(
  supabase: ReturnType<typeof createClient>,
  prefix: string,
  cb: (obj: { name: string; created_at?: string | null; id?: string | null }) => Promise<void> | void,
): Promise<void> {
  const stack: string[] = [prefix];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    let offset = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase.storage.from(BUCKET).list(cur, {
        limit: PAGE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw new Error(`list ${cur}: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const item of data) {
        const fullName = cur ? `${cur}/${item.name}` : item.name;
        // Folders have id === null in supabase storage list response.
        if ((item as any).id === null || (item as any).id === undefined) {
          // Could be folder OR a placeholder. Push as folder.
          stack.push(fullName);
        } else {
          await cb({
            name: fullName,
            created_at: (item as any).created_at,
            id: (item as any).id,
          });
        }
      }
      if (data.length < PAGE) break;
      offset += PAGE;
    }
  }
}
