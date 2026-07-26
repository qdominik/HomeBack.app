import { expect, type Locator, type Page } from "@playwright/test";
import {
  registerAndCreateHousehold,
  type E2ECredentials,
} from "./auth";

export type M4D8Dataset = {
  credentials: E2ECredentials;
  suffix: string;
  room: {
    kitchen: string;
    salon: string;
  };
  furniture: {
    cabinet: string;
    chest: string;
    shelf: string;
  };
  storageSpace: {
    emptyKitchen: string;
    emptyShelf: string;
    lowerDrawer: string;
    middleShelf: string;
    sideDrawer: string;
    upperDrawer: string;
  };
  item: {
    album: string;
    charger: string;
    extension: string;
    jewelryBox: string;
    oldDocument: string;
    remote: string;
    warrantyDocuments: string;
  };
};

function tagged(name: string, suffix: string) {
  return `${name} (test-${suffix})`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function prepareDeletionDataset(
  page: Page,
  prefix: string,
): Promise<M4D8Dataset> {
  const credentials = await registerAndCreateHousehold(page, prefix);

  await page.goto("/settings?tab=test-data");
  const datasetForm = page.locator("form").filter({
    has: page.getByRole("heading", {
      name: "Dane do testów usuwania",
      exact: true,
    }),
  });
  await datasetForm.getByRole("button", { name: "Wygeneruj" }).click();
  await expect(page).toHaveURL(/status=test_data_generated/);
  await expect(
    page.getByText("Dane testowe zostały wygenerowane.", { exact: true }),
  ).toBeVisible();

  await page.goto("/home");
  const salonHeading = page.getByRole("heading", {
    level: 2,
    name: /^Salon \(test-[0-9a-f]{8}\)$/,
  });
  await expect(salonHeading).toBeVisible();
  const salonName = (await salonHeading.textContent()) ?? "";
  const suffix = salonName.match(/\(test-([0-9a-f]{8})\)$/)?.[1];

  if (!suffix) {
    throw new Error(`Cannot determine deletion dataset suffix from ${salonName}.`);
  }

  return {
    credentials,
    suffix,
    room: {
      kitchen: tagged("Kuchnia", suffix),
      salon: tagged("Salon", suffix),
    },
    furniture: {
      cabinet: tagged("Pusta szafka", suffix),
      chest: tagged("Komoda", suffix),
      shelf: tagged("Regał", suffix),
    },
    storageSpace: {
      emptyKitchen: tagged("Pusta półka", suffix),
      emptyShelf: tagged("Dolna półka (pusta)", suffix),
      lowerDrawer: tagged("Dolna szuflada", suffix),
      middleShelf: tagged("Środkowa półka", suffix),
      sideDrawer: tagged("Szuflada boczna", suffix),
      upperDrawer: tagged("Górna szuflada", suffix),
    },
    item: {
      album: tagged("Album rodzinny", suffix),
      charger: tagged("Ładowarka USB-C", suffix),
      extension: tagged("Przedłużacz", suffix),
      jewelryBox: tagged("Pudełko na biżuterię", suffix),
      oldDocument: tagged("Stary dokument", suffix),
      remote: tagged("Pilot do telewizora", suffix),
      warrantyDocuments: tagged("Dokumenty gwarancyjne", suffix),
    },
  };
}

export function roomCard(page: Page, roomName: string) {
  return page
    .getByRole("heading", { level: 2, name: roomName, exact: true })
    .locator("xpath=ancestor::article[1]");
}

export function furnitureCard(room: Locator, furnitureName: string) {
  return room
    .getByRole("heading", {
      level: 3,
      name: furnitureName,
      exact: true,
    })
    .locator("xpath=ancestor::section[1]");
}

export function storageSpaceCard(
  furniture: Locator,
  storageSpaceName: string,
) {
  return furniture
    .getByText(storageSpaceName, { exact: true })
    .locator("xpath=ancestor::li[1]");
}

export function itemCard(page: Page, itemName: string) {
  return page
    .getByRole("heading", { level: 2, name: itemName, exact: true })
    .locator("xpath=ancestor::article[1]");
}

export async function openDeleteDialog(
  triggerScope: Locator,
  triggerName: string,
  dialogName: string,
) {
  const trigger = triggerScope.getByRole("button", {
    name: triggerName,
    exact: true,
  });
  await trigger.click();

  const dialog = triggerScope.page().getByRole("dialog", {
    name: dialogName,
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Wybrana operacja", { exact: true }).first(),
  ).toBeVisible();

  return { dialog, trigger };
}

export async function expectDependencyCount(
  dialog: Locator,
  label: string,
  expected: number,
) {
  const definition = dialog
    .locator("dt")
    .filter({ hasText: new RegExp(`^${escapeRegExp(label)}$`) })
    .locator("..");
  await expect(definition.locator("dd")).toHaveText(String(expected));
}

export async function chooseResolution(
  dialog: Locator,
  resolutionLabel: string,
) {
  await dialog
    .getByRole("radio", {
      name: new RegExp(escapeRegExp(resolutionLabel)),
    })
    .check();
}

export async function selectTargetContaining(
  dialog: Locator,
  targetName: string,
) {
  const target = dialog.getByLabel("Wybierz docelowy Schowek");
  const optionTexts = await target.locator("option").allTextContents();
  const option = optionTexts.find((text) => text.includes(targetName));

  if (!option) {
    throw new Error(`No deletion target contains ${targetName}.`);
  }

  await target.selectOption({ label: option });
  return option;
}

export async function createEmptyRoom(page: Page, name: string) {
  await page.goto("/home");
  await page.getByRole("button", { name: "Dodaj Pomieszczenie" }).click();
  const form = page.locator("form").filter({
    has: page.getByRole("button", { name: "Utwórz Pomieszczenie" }),
  });
  await form.getByLabel("Nazwa Pomieszczenia").fill(name);
  await form
    .getByLabel("Rodzaj Pomieszczenia", { exact: true })
    .selectOption("Salon");
  await form.getByRole("button", { name: "Utwórz Pomieszczenie" }).click();
  await expect(roomCard(page, name)).toBeVisible();
}

export async function createEmptyFurniture(
  room: Locator,
  name: string,
) {
  await room.getByText(/^Dodaj mebel$/i).click();
  const form = room.locator("details[open] form").first();

  await form.getByLabel("Nazwa Mebla").fill(name);
  await form
    .getByLabel("Rodzaj Mebla", { exact: true })
    .selectOption("Szafka");
  await form.getByRole("button", { name: "Utwórz Mebel" }).click();
  await expect(furnitureCard(room, name)).toBeVisible();
}

export async function createStorageSpace(
  furniture: Locator,
  templateName: string,
) {
  await furniture.getByText(/^Dodaj schowek$/i).click();
  const form = furniture.locator("details[open] form").first();

  await form
    .getByLabel("Nazwa Schowka", { exact: true })
    .selectOption(templateName);
  await form.getByRole("button", { name: "Utwórz Schowek" }).click();
  await expect(storageSpaceCard(furniture, templateName)).toBeVisible();
}
export async function login(page: Page, credentials: E2ECredentials) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: "Zaloguj" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
