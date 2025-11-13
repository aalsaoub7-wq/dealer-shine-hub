// blocketClient.ts
// HTTP-wrapper runt Blockets Pro Import API v3.
// Anpassad för Deno/Supabase Edge Functions.

const BASE_URL = "https://api.blocket.se/pro-import-api/v3";

function getToken(): string {
  const token = Deno.env.get("BLOCKET_API_TOKEN");
  if (!token) {
    throw new Error(
      "[BlocketClient] BLOCKET_API_TOKEN saknas i environment. " +
      "Sätt den i Supabase secrets innan du kör mot produktion."
    );
  }
  return token;
}

async function blocketFetch(path: string, options: RequestInit = {}): Promise<any> {
  const TOKEN = getToken();
  
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
  async createAd(payload: any) {
    console.log("[BlocketClient] Creating ad with source_id:", payload.source_id);
    return blocketFetch("/ad", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateAd(sourceId: string, payload: any) {
    console.log("[BlocketClient] Updating ad:", sourceId);
    return blocketFetch(`/ad/${encodeURIComponent(sourceId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async patchAd(sourceId: string, partial: any) {
    console.log("[BlocketClient] Patching ad:", sourceId);
    return blocketFetch(`/ad/${encodeURIComponent(sourceId)}`, {
      method: "PATCH",
      body: JSON.stringify(partial),
    });
  },

  async deleteAd(sourceId: string) {
    console.log("[BlocketClient] Deleting ad:", sourceId);
    return blocketFetch(`/ad/${encodeURIComponent(sourceId)}`, {
      method: "DELETE",
    });
  },

  async getAd(sourceId: string) {
    console.log("[BlocketClient] Getting ad:", sourceId);
    return blocketFetch(`/ad/${encodeURIComponent(sourceId)}`, {
      method: "GET",
    });
  },

  async getAdLogs(
    sourceId: string,
    params?: { action?: string; state?: string; limit?: number; offset?: number }
  ) {
    const search = new URLSearchParams();
    if (params?.action) search.set("action", params.action);
    if (params?.state) search.set("state", params.state);
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.offset) search.set("offset", String(params.offset));
    const qs = search.toString() ? `?${search.toString()}` : "";
    return blocketFetch(`/ad/${encodeURIComponent(sourceId)}/log${qs}`, {
      method: "GET",
    });
  },

  async bumpAd(
    sourceId: string,
    opts?: { exclude_blocket?: boolean; exclude_bytbil?: boolean }
  ) {
    const params = new URLSearchParams();
    if (opts?.exclude_blocket) params.set("exclude_blocket", "true");
    if (opts?.exclude_bytbil) params.set("exclude_bytbil", "true");
    const qs = params.toString() ? `?${params.toString()}` : "";
    return blocketFetch(`/ad/${encodeURIComponent(sourceId)}/bump${qs}`, {
      method: "GET",
    });
  },

  async validateAd(payload: any) {
    return blocketFetch("/ad/validate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
