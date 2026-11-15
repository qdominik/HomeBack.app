export type QuickItemSelection =
  | { kind: "all" | "unlocated" | "archived" }
  | { kind: "room"; id: string };

// Location shortcuts are exclusive. Keep the independent search/category/date
// filters, but never carry a previous room's furniture or storage into another.
export function quickItemFilterSearch(search: string, selection: QuickItemSelection) {
  const params = new URLSearchParams(search);
  for (const key of ["view", "room", "storage", "position", "itemStatus", "focus", "error", "status"]) {
    params.delete(key);
  }
  if (selection.kind === "room") params.set("room", selection.id);
  else if (selection.kind !== "all") params.set("view", selection.kind);
  return params.toString();
}
