export const CUSTOM_TEMPLATE_VALUE = "Inne";

export type HomeTemplateLocale = "pl" | "en";

export const FURNITURE_CUSTOM_TEMPLATE_VALUES = {
  pl: "Inny mebel lub element wyposa\u017cenia",
  en: "Other furniture or equipment",
} as const;

export const STORAGE_SPACE_CUSTOM_TEMPLATE_VALUES = {
  pl: "Inny Schowek",
  en: "Other storage space",
} as const;

export const ROOM_TEMPLATE_OPTIONS = [
  "Salon",
  "Sypialnia",
  "Kuchnia",
  "Pok\u00f3j dziecka",
  "Pok\u00f3j go\u015bcinny",
  "Przedpok\u00f3j",
  "\u0141azienka",
  "WC",
  "Piwnica",
  "Balkon",
  CUSTOM_TEMPLATE_VALUE,
] as const;

export const FURNITURE_TEMPLATE_OPTIONS_PL = [
  "Komoda",
  "Szafa",
  "Szafka",
  "Szafka nocna",
  "Rega\u0142",
  "P\u00f3\u0142ka wisz\u0105ca",
  "Modu\u0142 p\u00f3\u0142kowy",
  "\u0141\u00f3\u017cko",
  "Biurko",
  "St\u00f3\u0142",
  "\u0141awa",
  "Witryna",
  "Kredens",
  "RTV",
  "Lod\u00f3wka",
  "Zamra\u017carka",
  "Sejf",
  "Walizka",
  "Skrzynia",
  FURNITURE_CUSTOM_TEMPLATE_VALUES.pl,
] as const;

export const FURNITURE_TEMPLATE_OPTIONS_EN = [
  "Chest of drawers",
  "Wardrobe",
  "Cabinet",
  "Bedside table",
  "Shelving unit",
  "Wall shelf",
  "Shelving module",
  "Bed",
  "Desk",
  "Table",
  "Coffee table",
  "Display cabinet",
  "Cupboard",
  "TV unit",
  "Refrigerator",
  "Freezer",
  "Safe",
  "Suitcase",
  "Storage chest",
  FURNITURE_CUSTOM_TEMPLATE_VALUES.en,
] as const;

export const STORAGE_SPACE_TEMPLATE_OPTIONS_PL = [
  "Szuflada",
  "G\u00f3rna szuflada",
  "Dolna szuflada",
  "G\u00f3rna p\u00f3\u0142ka",
  "Dolna p\u00f3\u0142ka",
  "P\u00f3\u0142ka 1",
  "P\u00f3\u0142ka 2",
  "Lewa p\u00f3\u0142ka",
  "Prawa p\u00f3\u0142ka",
  "Komora",
  "Wn\u0119ka",
  "Schowek pod \u0142\u00f3\u017ckiem",
  "Pojemnik",
  "Pude\u0142ko",
  "Kosz",
  "Organizer",
  "Drzwiczki lewe",
  "Drzwiczki prawe",
  "G\u00f3rna cz\u0119\u015b\u0107",
  "Dolna cz\u0119\u015b\u0107",
  STORAGE_SPACE_CUSTOM_TEMPLATE_VALUES.pl,
] as const;

export const STORAGE_SPACE_TEMPLATE_OPTIONS_EN = [
  "Drawer",
  "Top drawer",
  "Bottom drawer",
  "Top shelf",
  "Bottom shelf",
  "Shelf 1",
  "Shelf 2",
  "Left shelf",
  "Right shelf",
  "Compartment",
  "Cubby",
  "Under-bed storage",
  "Bin",
  "Box",
  "Basket",
  "Organizer",
  "Left section",
  "Right section",
  "Upper section",
  "Lower section",
  STORAGE_SPACE_CUSTOM_TEMPLATE_VALUES.en,
] as const;

export const STORAGE_LOCATION_TEMPLATE_OPTIONS =
  FURNITURE_TEMPLATE_OPTIONS_PL;

export function getFurnitureTemplateOptions(locale: HomeTemplateLocale) {
  return locale === "pl"
    ? FURNITURE_TEMPLATE_OPTIONS_PL
    : FURNITURE_TEMPLATE_OPTIONS_EN;
}

export function getStorageSpaceTemplateOptions(locale: HomeTemplateLocale) {
  return locale === "pl"
    ? STORAGE_SPACE_TEMPLATE_OPTIONS_PL
    : STORAGE_SPACE_TEMPLATE_OPTIONS_EN;
}
