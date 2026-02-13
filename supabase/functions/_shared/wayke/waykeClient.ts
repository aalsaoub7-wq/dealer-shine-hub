// waykeClient.ts
// HTTP wrapper for Wayke Dealer API with OAuth2 authentication.
// Adapted for Deno/Supabase Edge Functions.

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const clientId = Deno.env.get("WAYKE_CLIENT_ID");
  const clientSecret = Deno.env.get("WAYKE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error(
      "[WaykeClient] WAYKE_CLIENT_ID and WAYKE_CLIENT_SECRET must be set in environment secrets."
    );
  }

  console.log("[WaykeClient] Requesting new OAuth2 token...");

  const res = await fetch("https://auth.wayke.se/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "api-resource",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[WaykeClient] OAuth2 token error:", res.status, text);
    throw new Error(`Wayke OAuth2 error ${res.status}: ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

  console.log("[WaykeClient] OAuth2 token acquired, expires in", data.expires_in, "s");
  return cachedToken!;
}

const DEALER_API = "https://dealer-api.wayke.se";
const MEDIA_API = "https://api.wayke.se/media/v2";

async function waykeFetch(baseUrl: string, path: string, options: RequestInit = {}): Promise<any> {
  const token = await getAccessToken();

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    console.error("[WaykeClient] API error", res.status, text);
    throw new Error(`Wayke API error ${res.status}: ${text || "No body"}`);
  }

  return json ?? text;
}

export const WaykeClient = {
  async createVehicle(payload: any): Promise<any> {
    console.log("[WaykeClient] Creating vehicle...");
    return waykeFetch(DEALER_API, "/vehicle", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateVehicle(vehicleId: string, payload: any): Promise<any> {
    console.log("[WaykeClient] Updating vehicle:", vehicleId);
    return waykeFetch(DEALER_API, `/vehicle/${encodeURIComponent(vehicleId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async getVehicle(vehicleId: string): Promise<any> {
    console.log("[WaykeClient] Getting vehicle:", vehicleId);
    return waykeFetch(DEALER_API, `/vehicle/${encodeURIComponent(vehicleId)}/ad`, {
      method: "GET",
    });
  },

  async updateVehicleStatus(vehicleId: string, status: string): Promise<any> {
    console.log("[WaykeClient] Updating vehicle status:", vehicleId, status);
    return waykeFetch(DEALER_API, `/vehicle/${encodeURIComponent(vehicleId)}/ad/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  async uploadImageByUrl(imageUrl: string, branchId: string, vehicleId: string, sortOrder: number): Promise<any> {
    console.log("[WaykeClient] Uploading image by URL for vehicle:", vehicleId, "sortOrder:", sortOrder);
    return waykeFetch(MEDIA_API, "/image-url", {
      method: "POST",
      body: JSON.stringify({
        url: imageUrl,
        branchId,
        vehicleId,
        sortOrder,
      }),
    });
  },
};
