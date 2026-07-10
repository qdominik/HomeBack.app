import type { Database } from "@/types/database";
import { HOME_KIND_OTHER } from "@/lib/home/home-kind-suggestions";

export type Room = Database["public"]["Tables"]["room"]["Row"];
export type StorageLocationL2 =
  Database["public"]["Tables"]["storage_location_l2"]["Row"];
export type StorageLocationL3 =
  Database["public"]["Tables"]["storage_location_l3"]["Row"];

export type StorageLocationL2WithPositions = StorageLocationL2 & {
  positions: StorageLocationL3[];
};

export type RoomWithLocations = Room & {
  locations: StorageLocationL2WithPositions[];
};

export const DEFAULT_HOME_TYPE = HOME_KIND_OTHER;
