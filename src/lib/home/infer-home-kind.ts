import { inferTemplateOption } from "../templates/infer-template-option";
import {
  CUSTOM_TEMPLATE_VALUE,
  FURNITURE_CUSTOM_TEMPLATE_VALUES,
  getFurnitureTemplateOptions,
  getStorageSpaceTemplateOptions,
  type HomeTemplateLocale,
  ROOM_TEMPLATE_OPTIONS,
  STORAGE_SPACE_CUSTOM_TEMPLATE_VALUES,
} from "./home-template-options";

export type HomeKindScope = "room" | "storage" | "position";

const roomAliases = {
  "Pok\u00f3j dziecka": ["pok\u00f3j"],
} as const;

export function inferHomeKind(
  name: string,
  scope: HomeKindScope,
  locale: HomeTemplateLocale = "pl",
) {
  if (scope === "room") {
    return inferTemplateOption(
      name,
      ROOM_TEMPLATE_OPTIONS,
      CUSTOM_TEMPLATE_VALUE,
      roomAliases,
    );
  }

  if (scope === "storage") {
    return inferTemplateOption(
      name,
      getFurnitureTemplateOptions(locale),
      FURNITURE_CUSTOM_TEMPLATE_VALUES[locale],
    );
  }

  return inferTemplateOption(
    name,
    getStorageSpaceTemplateOptions(locale),
    STORAGE_SPACE_CUSTOM_TEMPLATE_VALUES[locale],
  );
}
