const roomTypeCodes: Record<string, string> = {
  balkon: "BAL",
  biuro: "BIU",
  garaz: "GAR",
  garderoba: "GDR",
  inne: "INN",
  korytarz: "KOR",
  kotlownia: "KOT",
  kuchnia: "KUC",
  lazienka: "LAZ",
  piwnica: "PIW",
  pokojdziecka: "POD",
  pokojgoscinny: "POG",
  pralnia: "PRA",
  przedpokoj: "PRZ",
  salon: "SAL",
  schowek: "SCH",
  spizarnia: "SPI",
  strych: "STR",
  sypialnia: "SYP",
  taras: "TAR",
  wc: "WC",
};

const storageLocationTypeCodes: Record<string, string> = {
  biurko: "BIU",
  inne: "INN",
  komoda: "KOM",
  kosz: "KOS",
  lozko: "LOZ",
  lozkorozkladane: "LOZ",
  organizer: "ORG",
  pawlacz: "PAW",
  pojemnik: "POJ",
  polka: "POL",
  pudelko: "PUD",
  regal: "REG",
  regalwiszacy: "RGW",
  skrzynka: "SKR",
  sofa: "SOF",
  stojak: "STO",
  szafa: "SZA",
  szafanarozna: "SZN",
  szafka: "SZF",
  szafkanarozna: "SZN",
  szafkawiszaca: "SZW",
  szuflada: "SZU",
  torba: "TOR",
  wieszak: "WIE",
  szafkanocna: "SNC",
  polkawiszaca: "PWI",
  modulpolkowy: "MPO",
  stol: "STO",
  lawa: "LAW",
  witryna: "WIT",
  kredens: "KRE",
  rtv: "RTV",
  lodowka: "LOD",
  zamrazarka: "ZAM",
  sejf: "SEJ",
  walizka: "WAL",
  skrzynia: "SKR",
  chestofdrawers: "KOM",
  wardrobe: "SZA",
  cabinet: "SZF",
  bedsidetable: "SNC",
  shelvingunit: "REG",
  wallshelf: "PWI",
  shelvingmodule: "MPO",
  bed: "LOZ",
  desk: "BIU",
  table: "STO",
  coffeetable: "LAW",
  displaycabinet: "WIT",
  cupboard: "KRE",
  tvunit: "RTV",
  refrigerator: "LOD",
  freezer: "ZAM",
  safe: "SEJ",
  suitcase: "WAL",
  storagechest: "SKR",
};

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase();
}

function locationSegment(name: string, order: number) {
  const numberFromName = name.match(/\d+/)?.[0];
  const prefix = normalizeSegment(name) || "POZ";

  return `${prefix}${numberFromName ?? order}`;
}

function kindCode(kind: string, fallbackName: string, codes: Record<string, string>) {
  const directCode = codes[normalizeKey(kind)];

  if (directCode) {
    return directCode;
  }

  return normalizeSegment(kind || fallbackName) || "INN";
}

export function generateLocationCode({
  locationName,
  locationOrder,
  roomName,
  roomType,
  storageLocationName,
  storageLocationType,
}: {
  locationName: string;
  locationOrder: number;
  roomName: string;
  roomType: string;
  storageLocationName: string;
  storageLocationType: string;
}) {
  const roomCode = kindCode(roomType, roomName, roomTypeCodes);
  const storageCode = kindCode(
    storageLocationType,
    storageLocationName,
    storageLocationTypeCodes,
  );
  const positionCode = locationSegment(locationName, locationOrder);

  return [roomCode, storageCode, positionCode].join("-");
}
