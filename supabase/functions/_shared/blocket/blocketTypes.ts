// blocketTypes.ts
// Typer för bil + Blocket-sync, anpassade för Supabase/Lovable Cloud databas

export type Car = {
  id: string;
  company_id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  mileage: number | null;
  fuel: string | null;
  gearbox: string | null;
  price: number | null;
  description: string | null;
  notes: string | null;
  registration_number: string | null;
  vin: string | null;
  color: string | null;
  image_urls: string[];
  publish_on_blocket: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlocketAdSync = {
  car_id: string;
  source_id: string;
  blocket_ad_id: string | null;
  blocket_store_id: string | null;
  state: "created" | "deleted" | "none";
  last_action: "create" | "update" | "delete" | "bump" | null;
  last_action_state: "processing" | "done" | "error" | null;
  last_error: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};
