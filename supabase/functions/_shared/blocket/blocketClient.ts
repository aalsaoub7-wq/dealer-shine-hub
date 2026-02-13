// blocketClient.ts
// HTTP-wrapper runt Blockets Pro Import API v3.
// Anpassad för Deno/Supabase Edge Functions.
// Supports per-company tokens passed as parameter, with env fallback.

const BASE_URL = "https://api.blocket.se/pro-import-api/v3";

function resolveToken(tokenOverride?: string): string {
  const token = tokenOverride || Deno.env.get("BLOCKET_API_TOKEN");
  if (!token) {
    throw new Error(
      "[BlocketClient] BLOCKET_API_TOKEN saknas. " +
      "Konfigurera den i synk-inställningarna eller som miljövariabel."
    );
  }
  return token;
}

async function blocketFetch(path: string, options: RequestInit = {}, tokenOverride?: string): Promise<any> {
  const TOKEN = resolveToken(tokenOverride);
  
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": TOKEN,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore JSON parse error
  }

  if (!res.ok) {
    console.error("[BlocketClient] API error", res.status, text);
    throw new Error(`Blocket API error ${res.status}: ${text || "No body"}`);
  }

  return json ?? text;
}

export const BlocketClient = {
  async createAd(payload: any, token?: string) {
    console.log("[BlocketClient] Creating ad with source_id:", payload.source_id);
    return blocketFetch("/ad", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token);
  },

  async updateAd(sourceId: string, payload: any, token?: string) {
    console.log("[BlocketClient] Updating ad:", sourceId);
    return blocketFetch(`/ad/${encodeURIComponent(sourceId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }, token);
  },

  async patchAd(sourceId: string, partial: any, token?: string) {
    console.log("[BlocketClient] Patching ad:", sourceId);
    return blocketFetch(`/ad/${encodeURIComponent(sourceId)}`, {
      method: "PATCH",
      body: JSON.stringify(partial),
    }, token);
  },

  async deleteAd(sourceId: string, token?: string) {
    console.log("[BlocketClient] Deleting ad:", sourceId);
    return blocketFetch(`/ad/${encodeURIComponent(sourceId)}`, {
      method: "DELETE",
    }, token);
  },

  async getAd(sourceId: string, token?: string) {
    console.log("[BlocketClient] Getting ad:", sourceId);
    return blocketFetch(`/ad/${encodeURIComponent(sourceId)}`, {
      method: "GET",
    }, token);
  },

  async getAdLogs(
    sourceId: string,
    params?: { action?: string; state?: string; limit?: number; offset?: number },
    token?: string
  ) {
    const search = new URLSearchParams();
    if (params?.action) search.set("action", params.action);
    if (params?.state) search.set("state", params.state);
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.offset) search.set("offset", String(params.offset));
    const qs = search.toString() ? `?${search.toString()}` : "";
    return blocketFetch(`/ad/${encodeURIComponent(sourceId)}/log${qs}`, {
      method: "GET",
    }, token);
  },

  async bumpAd(
    sourceId: string,
    opts?: { exclude_blocket?: boolean; exclude_bytbil?: boolean },
    token?: string
  ) {
    const params = new URLSearchParams();
    if (opts?.exclude_blocket) params.set("exclude_blocket", "true");
    if (opts?.exclude_bytbil) params.set("exclude_bytbil", "true");
    const qs = params.toString() ? `?${params.toString()}` : "";
    return blocketFetch(`/ad/${encodeURIComponent(sourceId)}/bump${qs}`, {
      method: "GET",
    }, token);
  },

  async validateAd(payload: any, token?: string) {
    return blocketFetch("/ad/validate", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token);
  },
};
