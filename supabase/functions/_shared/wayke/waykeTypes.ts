// waykeTypes.ts
// Types for Wayke sync, mirroring blocketTypes.ts pattern

export type WaykeAdSync = {
  car_id: string;
  source_id: string;
  wayke_vehicle_id: string | null;
  state: "created" | "deleted" | "none";
  last_action: "create" | "update" | "delete" | null;
  last_action_state: "processing" | "done" | "error" | "success" | null;
  last_error: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};
