import { inferHomeKind } from "../home/infer-home-kind";
import { normalizeTemplateValue } from "../templates/normalize-template-value";
import {
  getEntityIconFallback,
  normalizeEntityIconKey,
  type EntityIconKey,
} from "./entity-icon-validation";

const ROOM_KIND_ICON_KEYS: Record<string, EntityIconKey> = {
  balkon: "balcony",
  biuro: "office",
  garaz: "garage",
  kuchnia: "kitchen",
  lazienka: "bathroom",
  piwnica: "basement",
  "pokoj dziecka": "child-room",
  "pokoj goscinny": "bedroom",
  przedpokoj: "hallway",
  salon: "living-room",
  sypialnia: "bedroom",
  wc: "bathroom",
};

export type RoomIconSelectionMode = "automatic" | "manual";

export function getRoomIconKeyForKind(
  kind: string | null | undefined,
): EntityIconKey {
  const normalizedKind = normalizeTemplateValue(kind ?? "");

  return ROOM_KIND_ICON_KEYS[normalizedKind] ?? getEntityIconFallback("room");
}

export function inferRoomIconKey(
  name: string,
  kind?: string | null,
): EntityIconKey {
  const kindToUse = kind?.trim() || inferHomeKind(name, "room");

  return getRoomIconKeyForKind(kindToUse);
}

export function resolveRoomIconKey({
  currentIconKey,
  kind,
  name,
  selectionMode,
}: {
  currentIconKey: string | null | undefined;
  kind?: string | null;
  name: string;
  selectionMode: RoomIconSelectionMode;
}): EntityIconKey {
  if (selectionMode === "manual") {
    return normalizeEntityIconKey(currentIconKey, "room");
  }

  return inferRoomIconKey(name, kind);
}