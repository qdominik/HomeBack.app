export type CopyEntityKind = "room" | "furniture" | "storage" | "item";

export function defaultCopyName(name: string) {
  return `${name.trim()} — kopia`;
}

export function nextCopyName(name: string, existingNames: readonly string[]) {
  const base = defaultCopyName(name);
  const used = new Set(existingNames.map((value) => value.trim().toLocaleLowerCase()));
  if (!used.has(base.toLocaleLowerCase())) return base;
  let index = 2;
  while (used.has(`${base} ${index}`.toLocaleLowerCase())) index += 1;
  return `${base} ${index}`;
}

export function isCopyTargetValid(kind: CopyEntityKind, targetId: string | null) {
  return kind === "item" || Boolean(targetId);
}

export function copyDefaults(kind: CopyEntityKind) {
  return {
    kind,
    copyStructure: kind === "room",
    copyStorage: kind === "furniture",
    targetId: null as string | null,
  };
}
