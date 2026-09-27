import type { Database } from "../../types/database";

export type ProfileRole =
  | Database["public"]["Enums"]["profile_role"]
  // Temporary read compatibility for a database before migration 0024.
  | "domownik";

/** New writes use `dorosły`; this accepts only legacy database reads. */
export function isAdultProfileRole(
  role: ProfileRole | string | null | undefined,
): boolean {
  return role === "dorosły" || role === "domownik";
}
