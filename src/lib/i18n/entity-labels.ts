import { dictionaries } from ".";

export type HomeEntityKey = "room" | "storage" | "position";
export type EntityAction = "add" | "create" | "edit" | "delete";

export type EntityLabel = {
  singular: string;
  plural: string;
};

export type EntityLabelOverrides = Partial<
  Record<HomeEntityKey, Partial<EntityLabel>>
>;

type AppLocale = keyof typeof dictionaries;
type ResolvedEntityLabels = Record<HomeEntityKey, EntityLabel>;

function resolveLabelValue(defaultValue: string, overrideValue?: string) {
  return overrideValue?.trim() || defaultValue;
}

export function resolveEntityLabels(
  locale: AppLocale,
  overrides: EntityLabelOverrides = {},
): ResolvedEntityLabels {
  const defaults = dictionaries[locale].modules.home.entityLabels;

  return {
    room: {
      singular: resolveLabelValue(
        defaults.room.singular,
        overrides.room?.singular,
      ),
      plural: resolveLabelValue(defaults.room.plural, overrides.room?.plural),
    },
    storage: {
      singular: resolveLabelValue(
        defaults.storage.singular,
        overrides.storage?.singular,
      ),
      plural: resolveLabelValue(
        defaults.storage.plural,
        overrides.storage?.plural,
      ),
    },
    position: {
      singular: resolveLabelValue(
        defaults.position.singular,
        overrides.position?.singular,
      ),
      plural: resolveLabelValue(
        defaults.position.plural,
        overrides.position?.plural,
      ),
    },
  };
}

export function resolveEntityActionLabel(
  locale: AppLocale,
  action: EntityAction,
  entity: HomeEntityKey,
  overrides?: EntityLabelOverrides,
) {
  const labels = resolveEntityLabels(locale, overrides);
  const verb = dictionaries[locale].modules.home.entityActions[action];

  return verb + " " + labels[entity].singular.toLocaleLowerCase(locale);
}
