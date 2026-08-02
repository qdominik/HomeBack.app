import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database";

export const QA_TEST_DATASET_TYPE = "qa_smoke";

export const LEGACY_TEST_DATASET_TYPES = ["small", "medium", "deletion_test"] as const;

export const TEST_DATASET_TYPES = [
  QA_TEST_DATASET_TYPE,
  ...LEGACY_TEST_DATASET_TYPES,
] as const;

export type TestDatasetType = (typeof TEST_DATASET_TYPES)[number];

export type QaTestDataEnvironment = {
  nodeEnv?: string;
  siteUrl?: string;
  vercelEnv?: string;
};

type DbClient = SupabaseClient<Database>;

type CategoryKey =
  | "books"
  | "documents"
  | "electronics"
  | "food"
  | "other"
  | "spare_parts"
  | "tools";

type CategoryRow = {
  id: string;
  key: string | null;
};

type QaRoom = {
  key: "living" | "bedroom" | "kitchen";
  name: string;
  type: string;
  order: number;
};

type QaFurniture = {
  key: "sofa" | "dresser" | "wallShelf" | "kitchenCabinet";
  roomKey: QaRoom["key"];
  name: string;
  type: string;
  order: number;
};

type QaStorage = {
  key: "topShelf" | "bottomShelf" | "drawer1" | "drawer2";
  furnitureKey: QaFurniture["key"];
  name: string;
  code: string;
  order: number;
};

type QaItem = {
  name: string;
  categoryKey: CategoryKey;
  description: string;
  quantity?: number;
  unit?: string;
  storageKey?: QaStorage["key"];
  status: Database["public"]["Enums"]["item_status"];
  statusBeforeArchive?: Database["public"]["Enums"]["item_status"];
  type: Database["public"]["Enums"]["item_type"];
};

export const QA_TEST_DATA_PLAN = {
  rooms: [
    { key: "living", name: "QA Salon", type: "Salon", order: 1 },
    { key: "bedroom", name: "QA Sypialnia", type: "Sypialnia", order: 2 },
    { key: "kitchen", name: "QA Kuchnia", type: "Kuchnia", order: 3 },
  ] satisfies QaRoom[],
  furniture: [
    { key: "sofa", roomKey: "living", name: "QA Sofa", type: "Sofa", order: 1 },
    { key: "dresser", roomKey: "bedroom", name: "QA Komoda", type: "Komoda", order: 1 },
    { key: "wallShelf", roomKey: "living", name: "QA Półka wisząca", type: "Półka", order: 2 },
    { key: "kitchenCabinet", roomKey: "kitchen", name: "QA Szafka kuchenna", type: "Szafka", order: 1 },
  ] satisfies QaFurniture[],
  storage: [
    { key: "topShelf", furnitureKey: "wallShelf", name: "QA Górna półka", code: "QA-GOR-1", order: 1 },
    { key: "bottomShelf", furnitureKey: "kitchenCabinet", name: "QA Dolna półka", code: "QA-DOL-1", order: 1 },
    { key: "drawer1", furnitureKey: "dresser", name: "QA Szuflada 1", code: "QA-SZU-1", order: 1 },
    { key: "drawer2", furnitureKey: "dresser", name: "QA Szuflada 2", code: "QA-SZU-2", order: 2 },
  ] satisfies QaStorage[],
  items: [
    {
      name: "QA Latarka",
      categoryKey: "tools",
      description: "Testowa rzecz z pełną lokalizacją.",
      quantity: 1,
      storageKey: "drawer1",
      status: "w domu",
      type: "unikalny",
    },
    {
      name: "QA Dokumenty auta",
      categoryKey: "documents",
      description: "Testowe dokumenty z pełną lokalizacją.",
      quantity: 1,
      storageKey: "bottomShelf",
      status: "w domu",
      type: "zestaw",
    },
    {
      name: "QA Baterie AA",
      categoryKey: "spare_parts",
      description: "Testowy zapas z pełną lokalizacją.",
      quantity: 8,
      unit: "szt.",
      storageKey: "topShelf",
      status: "w domu",
      type: "zapas",
    },
    {
      name: "QA Notatnik",
      categoryKey: "other",
      description: "Testowa rzecz bez lokalizacji.",
      quantity: 1,
      status: "w domu",
      type: "unikalny",
    },
    {
      name: "QA Kabel USB",
      categoryKey: "electronics",
      description: "Testowa rzecz bez lokalizacji.",
      quantity: 2,
      unit: "szt.",
      status: "w domu",
      type: "zapas",
    },
    {
      name: "QA Stary pilot",
      categoryKey: "electronics",
      description: "Testowa rzecz archiwalna z lokalizacją.",
      quantity: 1,
      storageKey: "drawer2",
      status: "archiwalne",
      statusBeforeArchive: "w domu",
      type: "unikalny",
    },
    {
      name: "QA Przeterminowany rachunek",
      categoryKey: "documents",
      description: "Testowa rzecz archiwalna bez lokalizacji.",
      quantity: 1,
      status: "archiwalne",
      statusBeforeArchive: "w domu",
      type: "unikalny",
    },
  ] satisfies QaItem[],
} as const;

export type QaTestDataSummary = {
  roomsCreated: number;
  furnitureCreated: number;
  storageCreated: number;
  itemsCreated: number;
  locationsCreated: number;
};

export function isQaTestDataEnvironment(env: QaTestDataEnvironment): boolean {
  const siteUrl = env.siteUrl ?? "";
  const isLocal =
    siteUrl.includes("127.0.0.1") || siteUrl.includes("localhost");

  if (env.vercelEnv === "preview") {
    return true;
  }

  return env.nodeEnv !== "production" && isLocal;
}

export function isSupportedTestDatasetType(
  value: unknown,
): value is TestDatasetType {
  return (
    typeof value === "string" &&
    TEST_DATASET_TYPES.includes(value as TestDatasetType)
  );
}

export function collectQaTestDataNames() {
  return [
    ...QA_TEST_DATA_PLAN.rooms.map((room) => room.name),
    ...QA_TEST_DATA_PLAN.furniture.map((furniture) => furniture.name),
    ...QA_TEST_DATA_PLAN.storage.map((storage) => storage.name),
    ...QA_TEST_DATA_PLAN.items.map((item) => item.name),
  ];
}

async function firstOrThrow<T>(
  response: { data: T[] | null; error: { message: string } | null },
  context: string,
) {
  if (response.error) {
    throw new Error(`${context}: ${response.error.message}`);
  }

  return response.data?.[0] ?? null;
}

async function ensureRoom(
  supabase: DbClient,
  householdId: string,
  room: QaRoom,
): Promise<{ id: string; created: boolean }> {
  const existing = await firstOrThrow(
    await supabase
      .from("room")
      .select("id")
      .eq("household_id", householdId)
      .eq("nazwa", room.name)
      .limit(1),
    `find room ${room.name}`,
  );

  if (existing) {
    return { id: existing.id, created: false };
  }

  const { data, error } = await supabase
    .from("room")
    .insert({
      household_id: householdId,
      nazwa: room.name,
      typ: room.type,
      opis: "Dane testowe QA do lokalnego i Preview smoke testu.",
      kolejność: room.order,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`create room ${room.name}: ${error.message}`);
  }

  return { id: data.id, created: true };
}

async function ensureFurniture(
  supabase: DbClient,
  roomId: string,
  furniture: QaFurniture,
): Promise<{ id: string; created: boolean }> {
  const existing = await firstOrThrow(
    await supabase
      .from("storage_location_l2")
      .select("id")
      .eq("room_id", roomId)
      .eq("nazwa", furniture.name)
      .limit(1),
    `find furniture ${furniture.name}`,
  );

  if (existing) {
    return { id: existing.id, created: false };
  }

  const { data, error } = await supabase
    .from("storage_location_l2")
    .insert({
      room_id: roomId,
      nazwa: furniture.name,
      typ: furniture.type,
      opis: "Dane testowe QA do lokalnego i Preview smoke testu.",
      kolejność: furniture.order,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`create furniture ${furniture.name}: ${error.message}`);
  }

  return { id: data.id, created: true };
}

async function ensureStorage(
  supabase: DbClient,
  furnitureId: string,
  storage: QaStorage,
): Promise<{ id: string; created: boolean }> {
  const existing = await firstOrThrow(
    await supabase
      .from("storage_location_l3")
      .select("id")
      .eq("storage_location_l2_id", furnitureId)
      .eq("nazwa", storage.name)
      .limit(1),
    `find storage ${storage.name}`,
  );

  if (existing) {
    return { id: existing.id, created: false };
  }

  const { data, error } = await supabase
    .from("storage_location_l3")
    .insert({
      storage_location_l2_id: furnitureId,
      nazwa: storage.name,
      opis: "Dane testowe QA do lokalnego i Preview smoke testu.",
      kod_lokalizacji: storage.code,
      kolejność: storage.order,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`create storage ${storage.name}: ${error.message}`);
  }

  return { id: data.id, created: true };
}

async function loadCategories(
  supabase: DbClient,
  householdId: string,
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("category")
    .select("id, key")
    .or(`household_id.is.null,household_id.eq.${householdId}`);

  if (error) {
    throw new Error(`load categories: ${error.message}`);
  }

  const categories = new Map<string, string>();
  const fallback = (data as CategoryRow[] | null)?.[0]?.id;

  for (const category of (data as CategoryRow[] | null) ?? []) {
    if (category.key) {
      categories.set(category.key, category.id);
    }
  }

  if (!fallback) {
    throw new Error("load categories: no categories available");
  }

  for (const item of QA_TEST_DATA_PLAN.items) {
    if (!categories.has(item.categoryKey)) {
      categories.set(item.categoryKey, fallback);
    }
  }

  return categories;
}

async function ensureItem(
  supabase: DbClient,
  householdId: string,
  userId: string,
  categoryId: string,
  item: QaItem,
): Promise<{ id: string; created: boolean }> {
  const existing = await firstOrThrow(
    await supabase
      .from("item")
      .select("id")
      .eq("household_id", householdId)
      .eq("nazwa", item.name)
      .limit(1),
    `find item ${item.name}`,
  );

  if (existing) {
    return { id: existing.id, created: false };
  }

  const archivedAt = item.status === "archiwalne" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("item")
    .insert({
      household_id: householdId,
      category_id: categoryId,
      nazwa: item.name,
      opis: item.description,
      typ: item.type,
      ilosc: item.quantity ?? null,
      jednostka: item.unit ?? null,
      status: item.status,
      status_before_archive: item.statusBeforeArchive ?? null,
      archived_at: archivedAt,
      created_by_id: userId,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`create item ${item.name}: ${error.message}`);
  }

  return { id: data.id, created: true };
}

async function ensureItemLocation(
  supabase: DbClient,
  itemId: string,
  storageId: string,
): Promise<boolean> {
  const existing = await firstOrThrow(
    await supabase
      .from("item_location")
      .select("id")
      .eq("item_id", itemId)
      .eq("storage_location_l3_id", storageId)
      .limit(1),
    `find item location ${itemId}`,
  );

  if (existing) {
    return false;
  }

  const { error } = await supabase.from("item_location").insert({
    item_id: itemId,
    storage_location_l3_id: storageId,
    czy_glowna: true,
    notatka: "Dane testowe QA.",
  });

  if (error) {
    throw new Error(`create item location ${itemId}: ${error.message}`);
  }

  return true;
}

export async function generateQaSmokeTestData(
  supabase: DbClient,
  params: { householdId: string; userId: string },
): Promise<QaTestDataSummary> {
  const summary: QaTestDataSummary = {
    roomsCreated: 0,
    furnitureCreated: 0,
    storageCreated: 0,
    itemsCreated: 0,
    locationsCreated: 0,
  };

  const roomIds = new Map<QaRoom["key"], string>();
  for (const room of QA_TEST_DATA_PLAN.rooms) {
    const result = await ensureRoom(supabase, params.householdId, room);
    roomIds.set(room.key, result.id);
    if (result.created) {
      summary.roomsCreated += 1;
    }
  }

  const furnitureIds = new Map<QaFurniture["key"], string>();
  for (const furniture of QA_TEST_DATA_PLAN.furniture) {
    const roomId = roomIds.get(furniture.roomKey);
    if (!roomId) {
      throw new Error(`missing room ${furniture.roomKey}`);
    }
    const result = await ensureFurniture(supabase, roomId, furniture);
    furnitureIds.set(furniture.key, result.id);
    if (result.created) {
      summary.furnitureCreated += 1;
    }
  }

  const storageIds = new Map<QaStorage["key"], string>();
  for (const storage of QA_TEST_DATA_PLAN.storage) {
    const furnitureId = furnitureIds.get(storage.furnitureKey);
    if (!furnitureId) {
      throw new Error(`missing furniture ${storage.furnitureKey}`);
    }
    const result = await ensureStorage(supabase, furnitureId, storage);
    storageIds.set(storage.key, result.id);
    if (result.created) {
      summary.storageCreated += 1;
    }
  }

  const categories = await loadCategories(supabase, params.householdId);
  for (const item of QA_TEST_DATA_PLAN.items) {
    const categoryId = categories.get(item.categoryKey);
    if (!categoryId) {
      throw new Error(`missing category ${item.categoryKey}`);
    }

    const result = await ensureItem(
      supabase,
      params.householdId,
      params.userId,
      categoryId,
      item,
    );

    if (result.created) {
      summary.itemsCreated += 1;
    }

    if (!item.storageKey) {
      continue;
    }

    const storageId = storageIds.get(item.storageKey);
    if (!storageId) {
      throw new Error(`missing storage ${item.storageKey}`);
    }

    if (await ensureItemLocation(supabase, result.id, storageId)) {
      summary.locationsCreated += 1;
    }
  }

  return summary;
}
