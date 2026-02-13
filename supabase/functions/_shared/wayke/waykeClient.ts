// waykeClient.ts
// HTTP wrapper for Wayke Dealer API with OAuth2 authentication.
// Supports per-company credentials passed as parameters, with env fallback.

export interface WaykeCredentials {
  clientId: string;
  clientSecret: string;
  branchId: string;
}

// Token cache keyed by clientId to support multiple companies
const tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

async function getAccessToken(creds: WaykeCredentials): Promise<string> {
  const cached = tokenCache.get(creds.clientId);
  if (cached && Date.now() < cached.expiresAt - 60000) {
    return cached.token;
  }

  if (!creds.clientId || !creds.clientSecret) {
    throw new Error(
      "[WaykeClient] Wayke Client ID och Client Secret måste konfigureras."
    );
  }

  console.log("[WaykeClient] Requesting new OAuth2 token...");

  const res = await fetch("https://auth.wayke.se/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      scope: "api-resource",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[WaykeClient] OAuth2 token error:", res.status, text);
    throw new Error(`Wayke OAuth2 error ${res.status}: ${text}`);
  }

  const data = await res.json();
  tokenCache.set(creds.clientId, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  });

  console.log("[WaykeClient] OAuth2 token acquired, expires in", data.expires_in, "s");
  return data.access_token;
}

const DEALER_API = "https://dealer-api.wayke.se";
const MEDIA_API = "https://api.wayke.se/media/v2";

async function waykeFetch(baseUrl: string, path: string, creds: WaykeCredentials, options: RequestInit = {}): Promise<any> {
  const token = await getAccessToken(creds);

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
  async createVehicle(payload: any, creds: WaykeCredentials): Promise<any> {
    console.log("[WaykeClient] Creating vehicle...");
    return waykeFetch(DEALER_API, "/vehicle", creds, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateVehicle(vehicleId: string, payload: any, creds: WaykeCredentials): Promise<any> {
    console.log("[WaykeClient] Updating vehicle:", vehicleId);
    return waykeFetch(DEALER_API, `/vehicle/${encodeURIComponent(vehicleId)}`, creds, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async getVehicle(vehicleId: string, creds: WaykeCredentials): Promise<any> {
    console.log("[WaykeClient] Getting vehicle:", vehicleId);
    return waykeFetch(DEALER_API, `/vehicle/${encodeURIComponent(vehicleId)}/ad`, creds, {
      method: "GET",
    });
  },

  async updateVehicleStatus(vehicleId: string, status: string, creds: WaykeCredentials): Promise<any> {
    console.log("[WaykeClient] Updating vehicle status:", vehicleId, status);
    return waykeFetch(DEALER_API, `/vehicle/${encodeURIComponent(vehicleId)}/ad/status`, creds, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  async uploadImageByUrl(imageUrl: string, branchId: string, vehicleId: string, sortOrder: number, creds: WaykeCredentials): Promise<any> {
    console.log("[WaykeClient] Uploading image by URL for vehicle:", vehicleId, "sortOrder:", sortOrder);
    return waykeFetch(MEDIA_API, "/image-url", creds, {
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
