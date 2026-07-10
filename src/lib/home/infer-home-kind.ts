import { inferTemplateOption } from "../templates/infer-template-option";
import {
  CUSTOM_TEMPLATE_VALUE,
  ROOM_TEMPLATE_OPTIONS,
  STORAGE_LOCATION_TEMPLATE_OPTIONS,
} from "./home-template-options";

type HomeKindScope = "room" | "storage";

const roomAliases = {
  "Pokój dziecka": ["pokój"],
} as const;

export function inferHomeKind(name: string, scope: HomeKindScope) {
  const options =
    scope === "room"
      ? ROOM_TEMPLATE_OPTIONS
      : STORAGE_LOCATION_TEMPLATE_OPTIONS;

  return inferTemplateOption(
    name,
    options,
    CUSTOM_TEMPLATE_VALUE,
    scope === "room" ? roomAliases : undefined,
  );
}
