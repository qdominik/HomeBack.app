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
    allowFallback: false,
    group: "category",
    key: "heart",
    label: { en: "Heart", pl: "Serce" },
    searchTerms: ["heart", "serce", "hobby", "pasja"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "leaf",
    label: { en: "Leaf", pl: "Rosliny" },
    searchTerms: ["leaf", "rosliny", "ogrod", "kwiaty", "plants", "garden"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "paw-print",
    label: { en: "Pets", pl: "Zwierzeta" },
    searchTerms: ["pets", "zwierzeta", "pies", "kot", "animal", "paw"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "car",
    label: { en: "Car", pl: "Motoryzacja" },
    searchTerms: ["car", "motoryzacja", "samochod", "auto"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "bicycle",
    label: { en: "Bicycle", pl: "Rower" },
    searchTerms: ["bicycle", "rower", "bike", "sport"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "game-controller",
    label: { en: "Games", pl: "Gry" },
    searchTerms: ["games", "gry", "gaming", "game", "konsola"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "camera",
    label: { en: "Camera", pl: "Zdjecia" },
    searchTerms: ["camera", "zdjecia", "photos", "fotografia"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "music-note",
    label: { en: "Music", pl: "Muzyka" },
    searchTerms: ["music", "muzyka", "audio", "instrumenty"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "gift",
    label: { en: "Gifts", pl: "Prezenty" },
    searchTerms: ["gifts", "prezenty", "gift", "upominki"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "graduation-cap",
    label: { en: "Education", pl: "Edukacja" },
    searchTerms: ["education", "edukacja", "szkola", "nauka", "school"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "baby-carriage",
    label: { en: "Baby", pl: "Dziecko" },
    searchTerms: ["baby", "dziecko", "niemowle", "wyprawka"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "fire-extinguisher",
    label: { en: "Safety", pl: "Bezpieczenstwo" },
    searchTerms: ["safety", "bezpieczenstwo", "gasnica", "emergency"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "lightbulb",
    label: { en: "Ideas", pl: "Pomysly" },
    searchTerms: ["ideas", "pomysly", "light", "zarowka"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "shield-check",
    label: { en: "Protection", pl: "Ochrona" },
    searchTerms: ["protection", "ochrona", "security", "zabezpieczenia"],
  },
  {
    allowFallback: false,
    group: "category",
    key: "star",
    label: { en: "Favorites", pl: "Ulubione" },
    searchTerms: ["favorites", "ulubione", "star", "gwiazda"],
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
