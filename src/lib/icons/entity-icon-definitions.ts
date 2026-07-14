export type EntityIconGroup =
  | "room"
  | "storage"
  | "position"
  | "item"
  | "category"
  | "generic";

export type EntityIconDefinition = {
  allowFallback: boolean;
  group: EntityIconGroup;
  key: string;
  label: {
    en: string;
    pl: string;
  };
  searchTerms: string[];
};

export const ENTITY_ICON_DEFINITIONS = [
  {
    allowFallback: true,
    group: "room",
    key: "room",
    label: { en: "Room", pl: "Pomieszczenie" },
    searchTerms: ["room", "pomieszczenie", "dom", "pokoj"],
  },
  {
    allowFallback: false,
    group: "room",
    key: "living-room",
    label: { en: "Living room", pl: "Salon" },
    searchTerms: ["living", "salon", "sofa", "kanapa", "pokoj dzienny"],
  },
  {
    allowFallback: false,
    group: "room",
    key: "bedroom",
    label: { en: "Bedroom", pl: "Sypialnia" },
    searchTerms: ["bedroom", "sypialnia", "lozko", "spanie"],
  },
  {
    allowFallback: false,
    group: "room",
    key: "child-room",
    label: { en: "Child room", pl: "Pokoj dziecka" },
    searchTerms: ["child", "dziecko", "dzieciecy", "pokoj dziecka"],
  },
  {
    allowFallback: false,
    group: "room",
    key: "kitchen",
    label: { en: "Kitchen", pl: "Kuchnia" },
    searchTerms: ["kitchen", "kuchnia", "gotowanie"],
  },
  {
    allowFallback: false,
    group: "room",
    key: "bathroom",
    label: { en: "Bathroom", pl: "Lazienka" },
    searchTerms: ["bathroom", "lazienka", "wanna", "prysznic"],
  },
  {
    allowFallback: false,
    group: "room",
    key: "hallway",
    label: { en: "Hallway", pl: "Przedpokoj" },
    searchTerms: ["hallway", "corridor", "przedpokoj", "korytarz"],
  },
  {
    allowFallback: false,
    group: "room",
    key: "office",
    label: { en: "Office", pl: "Biuro" },
    searchTerms: ["office", "biuro", "praca", "gabinet"],
  },
  {
    allowFallback: false,
    group: "room",
    key: "garage",
    label: { en: "Garage", pl: "Garaz" },
    searchTerms: ["garage", "garaz", "auto", "samochod"],
  },
  {
    allowFallback: false,
    group: "room",
    key: "basement",
    label: { en: "Basement", pl: "Piwnica" },
    searchTerms: ["basement", "piwnica"],
  },
  {
    allowFallback: false,
    group: "room",
    key: "balcony",
    label: { en: "Balcony", pl: "Balkon" },
    searchTerms: ["balcony", "balkon", "taras", "terrace"],
  },
  {
    allowFallback: true,
    group: "storage",
    key: "storage",
    label: { en: "Storage", pl: "Schowek" },
    searchTerms: ["storage", "schowek", "miejsce", "przechowywanie"],
  },
  {
    allowFallback: false,
    group: "storage",
    key: "wardrobe",
    label: { en: "Wardrobe", pl: "Szafa" },
    searchTerms: ["wardrobe", "szafa", "garderoba"],
  },
  {
    allowFallback: false,
    group: "storage",
    key: "dresser",
    label: { en: "Dresser", pl: "Komoda" },
    searchTerms: ["dresser", "komoda"],
  },
  {
    allowFallback: false,
    group: "storage",
    key: "shelf",
    label: { en: "Shelf", pl: "Polka" },
    searchTerms: ["shelf", "polka", "regal"],
  },
  {
    allowFallback: false,
    group: "storage",
    key: "drawer",
    label: { en: "Drawer", pl: "Szuflada" },
    searchTerms: ["drawer", "szuflada"],
  },
  {
    allowFallback: false,
    group: "storage",
    key: "box",
    label: { en: "Box", pl: "Pudelko" },
    searchTerms: ["box", "pudelko", "pojemnik"],
  },
  {
    allowFallback: true,
    group: "position",
    key: "position",
    label: { en: "Position", pl: "Pozycja" },
    searchTerms: ["position", "pozycja", "miejsce"],
  },
  {
    allowFallback: true,
    group: "item",
    key: "package",
    label: { en: "Package", pl: "Paczka" },
    searchTerms: ["package", "paczka", "rzecz", "item", "przedmiot"],
  },
  {
    allowFallback: false,
    group: "item",
    key: "cube",
    label: { en: "Cube", pl: "Bryla" },
    searchTerms: ["cube", "kostka", "zestaw"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "medicine",
    label: { en: "Medicine", pl: "Leki" },
    searchTerms: ["medicine", "leki", "apteczka"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "food",
    label: { en: "Food", pl: "Zywnosc" },
    searchTerms: ["food", "zywnosc", "jedzenie"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "documents",
    label: { en: "Documents", pl: "Dokumenty" },
    searchTerms: ["documents", "dokumenty", "papier"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "clothing",
    label: { en: "Clothing", pl: "Ubrania" },
    searchTerms: ["clothing", "ubrania", "odziez"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "electronics",
    label: { en: "Electronics", pl: "Elektronika" },
    searchTerms: ["electronics", "elektronika", "urzadzenia"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "tools",
    label: { en: "Tools", pl: "Narzedzia" },
    searchTerms: ["tools", "narzedzia", "mlotek"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "books",
    label: { en: "Books", pl: "Ksiazki" },
    searchTerms: ["books", "ksiazki"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "spare-parts",
    label: { en: "Spare parts", pl: "Czesci zapasowe" },
    searchTerms: ["spare", "parts", "czesci", "zapasowe"],
  },
  {
    allowFallback: true,
    group: "category",
    key: "other",
    label: { en: "Other", pl: "Inne" },
    searchTerms: ["other", "inne", "pozostale"],
  },
  {
    allowFallback: true,
    group: "generic",
    key: "generic",
    label: { en: "Generic", pl: "Ogolne" },
    searchTerms: ["generic", "ogolne", "inne"],
  },
] as const satisfies readonly EntityIconDefinition[];

export type EntityIconKey = (typeof ENTITY_ICON_DEFINITIONS)[number]["key"];

export const ENTITY_ICON_FALLBACKS = {
  category: "other",
  generic: "generic",
  item: "package",
  position: "position",
  room: "room",
  storage: "storage",
} as const satisfies Record<EntityIconGroup, EntityIconKey>;
