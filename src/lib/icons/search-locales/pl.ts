import type { IconSearchLocalePack } from "./types";

const themes = [
  { id: "home", tokens: { house: ["dom", "mieszkanie"], apartment: ["apartament", "lokum"], building: ["budynek", "blok"], door: ["drzwi", "wejście"], bed: ["łóżko", "spanie"] } },
  { id: "storage", tokens: { chair: ["krzesło", "siedzisko"], armchair: ["fotel", "kanapa"], box: ["pudełko", "pojemnik"], dresser: ["komoda", "szafka"] } },
  { id: "documents", tokens: { file: ["plik", "dokument"], archive: ["archiwum", "segregator"], folder: ["folder", "teczka"], paper: ["papier", "dokument"] } },
  { id: "kitchen", tokens: { food: ["jedzenie", "żywność"], cooking: ["kuchnia", "gotowanie"], oven: ["piekarnik", "piec"], pot: ["garnek", "naczynie"] } },
  { id: "bathroom", tokens: { bathtub: ["łazienka", "wanna"], shower: ["prysznic", "łazienka"], toilet: ["toaleta", "wc"], soap: ["mydło", "higiena"] } },
  { id: "clothes", tokens: { shirt: ["koszula", "ubranie"], pants: ["spodnie", "odzież"], coat: ["płaszcz", "kurtka"], sock: ["skarpetka", "bielizna"] } },
  { id: "tools", tokens: { tool: ["narzędzie", "przyrząd"], wrench: ["klucz", "klucz warsztatowy"], hammer: ["młotek", "remont"], screwdriver: ["śrubokręt", "wkrętak"] } },
  { id: "electronics", tokens: { computer: ["komputer", "pc"], laptop: ["laptop", "notebook"], phone: ["telefon", "komórka"], washing: ["pralka", "pranie"] } },
  { id: "transport", tokens: { car: ["samochód", "auto", "pojazd"], airplane: ["samolot", "lotnictwo"], bicycle: ["rower", "jednoślad"], truck: ["ciężarówka", "transport"], train: ["pociąg", "kolej"] } },
  { id: "garden", tokens: { leaf: ["liść", "ogród"], flower: ["kwiat", "roślina"], tree: ["drzewo", "ogród"], plant: ["roślina", "doniczka"] } },
  { id: "animals", tokens: { dog: ["pies", "zwierzę"], cat: ["kot", "zwierzę"], bird: ["ptak", "zwierzę"], fish: ["ryba", "akwarium"] } },
  { id: "health", tokens: { pill: ["tabletka", "lek"], aid: ["pomoc", "pierwsza pomoc"], hospital: ["szpital", "zdrowie"], syringe: ["strzykawka", "zastrzyk"] } },
  { id: "people", tokens: { person: ["osoba", "człowiek"], users: ["użytkownicy", "rodzina"], baby: ["dziecko", "niemowlę"], human: ["człowiek", "osoba"] } },
  { id: "security", tokens: { lock: ["zamek", "kłódka"], shield: ["tarcza", "ochrona"], key: ["klucz", "bezpieczeństwo"], alarm: ["alarm", "ostrzeżenie"] } },
  { id: "weather", tokens: { cloud: ["chmura", "pogoda"], rain: ["deszcz", "pogoda"], snow: ["śnieg", "zima"], sun: ["słońce", "pogoda"] } },
  { id: "sport", tokens: { football: ["piłka nożna", "futbol"], basketball: ["koszykówka", "piłka"], tennis: ["tenis", "rakieta"], swimming: ["pływanie", "basen"] } },
  { id: "communication", tokens: { chat: ["czat", "rozmowa"], envelope: ["koperta", "wiadomość"], microphone: ["mikrofon", "nagranie"], call: ["połączenie", "telefon"] } },
  { id: "media", tokens: { music: ["muzyka", "dźwięk"], film: ["film", "kino"], camera: ["aparat", "zdjęcie"], video: ["wideo", "nagranie"] } },
  { id: "shopping", tokens: { shopping: ["zakupy", "sklep"], cart: ["koszyk", "wózek"], credit: ["kredyt", "karta"], wallet: ["portfel", "pieniądze"] } },
  { id: "time", tokens: { calendar: ["kalendarz", "data"], clock: ["zegar", "czas"], timer: ["minutnik", "czasomierz"], watch: ["zegarek", "czas"] } },
  { id: "navigation", tokens: { arrow: ["strzałka", "kierunek"], map: ["mapa", "nawigacja"], compass: ["kompas", "kierunek"], cursor: ["kursor", "wskaźnik"], trash: ["kosz", "śmieci", "usuwanie"] } },
] as const;

export const plIconSearchLocale: IconSearchLocalePack = {
  locale: "pl",
  themes,
  tokenAliases: Object.assign({}, ...themes.map((theme) => theme.tokens)),
  iconAliases: {
    FileArchiveIcon: ["archiwum dokumentów", "segregator", "plik archiwum"],
    ArmchairIcon: ["fotel"], CookingPotIcon: ["kuchnia", "garnek", "gotowanie"],
    BathtubIcon: ["łazienka", "wanna", "kąpiel"], FirstAidKitIcon: ["apteczka", "pierwsza pomoc"],
    WashingMachineIcon: ["pralka", "pranie", "agd"],
  },
};
