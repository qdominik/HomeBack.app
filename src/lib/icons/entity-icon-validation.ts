import {
  ENTITY_ICON_DEFINITIONS,
  ENTITY_ICON_FALLBACKS,
  type EntityIconDefinition,
  type EntityIconGroup,
  type EntityIconKey,
} from "./entity-icon-definitions";

export type { EntityIconGroup, EntityIconKey };

const definitionsByKey = new Map<string, EntityIconDefinition>(
  ENTITY_ICON_DEFINITIONS.map((definition) => [definition.key, definition]),
);

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function isEntityIconKey(value: unknown): value is EntityIconKey {
  return typeof value === "string" && definitionsByKey.has(value);
}

export function getEntityIconDefinition(
  key: string | null | undefined,
): EntityIconDefinition | null {
  if (!key || !isEntityIconKey(key)) {
    return null;
  }

  return definitionsByKey.get(key) ?? null;
}

export function getEntityIconFallback(group: EntityIconGroup): EntityIconKey {
  return ENTITY_ICON_FALLBACKS[group];
}

export function normalizeEntityIconKey(
  value: unknown,
  group: EntityIconGroup = "generic",
): EntityIconKey {
  if (isEntityIconKey(value)) {
    return value;
  }

  return getEntityIconFallback(group);
}

export function getEntityIconOptions(group?: EntityIconGroup) {
  return ENTITY_ICON_DEFINITIONS.filter((definition) =>
    group ? definition.group === group || definition.group === "generic" : true,
  );
}

export function searchEntityIconOptions(
  query: string,
  group?: EntityIconGroup,
) {
  const normalizedQuery = normalizeSearchValue(query);
  const options = getEntityIconOptions(group);

  if (!normalizedQuery) {
    return options;
  }

  return options.filter((definition) => {
    const searchable = [
      definition.key,
      definition.label.en,
      definition.label.pl,
      ...definition.searchTerms,
    ]
      .map(normalizeSearchValue)
      .join(" ");

    return searchable.includes(normalizedQuery);
  });
}

export function getDefaultRoomIconKey(): EntityIconKey {
  return getEntityIconFallback("room");
}
