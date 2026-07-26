import { expect, test } from "@playwright/test";
import { registerAndCreateHousehold } from "./support/auth";
import {
  chooseResolution,
  createEmptyFurniture,
  createEmptyRoom,
  createStorageSpace,
  expectDependencyCount,
  furnitureCard,
  itemCard,
  login,
  openDeleteDialog,
  prepareDeletionDataset,
  roomCard,
  selectTargetContaining,
  storageSpaceCard,
} from "./support/m4d8";

test("M4D.8 admin deletes an empty Room after cancel, Escape and retry", async ({
  page,
}) => {
  await registerAndCreateHousehold(page, "m4d8-empty-room");
  const roomName = `Puste Pomieszczenie ${Date.now()}`;
  await createEmptyRoom(page, roomName);

  const card = roomCard(page, roomName);
  const trigger = card.getByRole("button", {
    name: "Usuń Pomieszczenie",
    exact: true,
  });
  await expect(trigger).toHaveAttribute("type", "button");

  let opened = await openDeleteDialog(
    card,
    "Usuń Pomieszczenie",
    "Usuń Pomieszczenie",
  );
  await expect(opened.dialog.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(opened.dialog).toBeHidden();
  await expect(opened.trigger).toBeFocused();
  await expect(card).toBeVisible();

  opened = await openDeleteDialog(
    card,
    "Usuń Pomieszczenie",
    "Usuń Pomieszczenie",
  );
  await opened.dialog.getByRole("button", { name: "Anuluj" }).first().click();
  await expect(opened.dialog).toBeHidden();
  await expect(opened.trigger).toBeFocused();
  await expect(card).toBeVisible();

  opened = await openDeleteDialog(
    card,
    "Usuń Pomieszczenie",
    "Usuń Pomieszczenie",
  );
  await opened.dialog
    .getByRole("button", { name: "Usuń Pomieszczenie trwale" })
    .click();
  await expect(opened.dialog).toBeHidden();
  await expect(card).toHaveCount(0);
  await expect
    .soft(page.getByText("Pomieszczenie zostało usunięte.", { exact: true }))
    .toBeVisible();

  await page.reload();
  await expect(roomCard(page, roomName)).toHaveCount(0);
});

test("M4D.8 deletes a Room with empty Furniture and Storage spaces", async ({
  page,
}) => {
  const data = await prepareDeletionDataset(page, "m4d8-room-empty-tree");
  const kitchen = roomCard(page, data.room.kitchen);
  const { dialog } = await openDeleteDialog(
    kitchen,
    "Usuń Pomieszczenie",
    "Usuń Pomieszczenie",
  );

  await expectDependencyCount(dialog, "Meble", 1);
  await expectDependencyCount(dialog, "Schowki", 1);
  await expectDependencyCount(dialog, "Łącznie Rzeczy", 0);
  await expectDependencyCount(dialog, "Łącznie przypisań", 0);
  await expect(
    dialog.getByText("Pomieszczenie nie zawiera przypisanych Rzeczy."),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Anuluj" }).last().click();
  await expect(kitchen).toBeVisible();

  const retry = await openDeleteDialog(
    kitchen,
    "Usuń Pomieszczenie",
    "Usuń Pomieszczenie",
  );
  await retry.dialog
    .getByRole("button", {
      name: "Usuń Pomieszczenie i jego strukturę",
    })
    .click();
  await expect(kitchen).toHaveCount(0);
  await expect(roomCard(page, data.room.salon)).toBeVisible();
  await expect
    .soft(page.getByText("Pomieszczenie zostało usunięte.", { exact: true }))
    .toBeVisible();

  await page.reload();
  await expect(roomCard(page, data.room.kitchen)).toHaveCount(0);
});

test("M4D.8 detaches Room Items into Without location and preserves archived Items", async ({
  page,
}) => {
  const data = await prepareDeletionDataset(page, "m4d8-room-detach");
  const salon = roomCard(page, data.room.salon);
  const { dialog } = await openDeleteDialog(
    salon,
    "Usuń Pomieszczenie",
    "Usuń Pomieszczenie",
  );

  await expectDependencyCount(dialog, "Meble", 2);
  await expectDependencyCount(dialog, "Schowki", 5);
  await expectDependencyCount(dialog, "Aktywne Rzeczy", 6);
  await expectDependencyCount(dialog, "Archiwalne Rzeczy", 1);
  await expectDependencyCount(dialog, "Łącznie Rzeczy", 7);
  await expectDependencyCount(dialog, "Łącznie przypisań", 8);

  await chooseResolution(dialog, "Odepnij Rzeczy i usuń Pomieszczenie");
  await dialog.getByRole("button", { name: "Dalej" }).click();
  await dialog
    .getByRole("button", {
      name: "Odepnij Rzeczy i usuń Pomieszczenie",
    })
    .click();
  await expect(salon).toHaveCount(0);
  await expect
    .soft(page.getByText("Pomieszczenie zostało usunięte.", { exact: true }))
    .toBeVisible();

  await page.goto("/items?view=unlocated");
  for (const itemName of [
    data.item.charger,
    data.item.remote,
    data.item.warrantyDocuments,
    data.item.album,
    data.item.extension,
    data.item.jewelryBox,
  ]) {
    await expect(itemCard(page, itemName)).toContainText(
      "Brak przypisanej lokalizacji",
    );
  }

  await page.goto("/items?view=archived");
  await expect(itemCard(page, data.item.oldDocument)).toContainText(
    "Brak przypisanej lokalizacji",
  );
  await page.reload();
  await expect(itemCard(page, data.item.oldDocument)).toBeVisible();
});

test("M4D.8 moves Room Items to a changed external target and excludes its subtree", async ({
  page,
}) => {
  const data = await prepareDeletionDataset(page, "m4d8-room-move");
  const kitchen = roomCard(page, data.room.kitchen);
  const cabinet = furnitureCard(kitchen, data.furniture.cabinet);
  await createStorageSpace(cabinet, "Półka 1");
  await page.reload();

  const salon = roomCard(page, data.room.salon);
  const { dialog } = await openDeleteDialog(
    salon,
    "Usuń Pomieszczenie",
    "Usuń Pomieszczenie",
  );
  await chooseResolution(dialog, "Przenieś Rzeczy do jednego Schowka");
  const select = dialog.getByLabel("Wybierz docelowy Schowek");
  await expect(select).not.toContainText(data.room.salon);
  await selectTargetContaining(dialog, data.storageSpace.emptyKitchen);
  const finalTarget = await selectTargetContaining(dialog, "Półka 1");
  await dialog.getByRole("button", { name: "Dalej" }).click();
  await expect(dialog).toContainText(finalTarget);
  await dialog
    .getByRole("button", {
      name: "Przenieś Rzeczy i usuń Pomieszczenie",
    })
    .click();
  await expect(salon).toHaveCount(0);
  await expect
    .soft(page.getByText("Pomieszczenie zostało usunięte.", { exact: true }))
    .toBeVisible();

  await page.goto("/items");
  for (const itemName of [
    data.item.charger,
    data.item.album,
    data.item.extension,
  ]) {
    await expect(itemCard(page, itemName)).toContainText(
      `${data.room.kitchen} / ${data.furniture.cabinet} / Półka 1`,
    );
  }
  await page.reload();
  await expect(itemCard(page, data.item.charger)).toContainText("Półka 1");
});

test("M4D.8 deletes empty Furniture with and without Storage spaces", async ({
  page,
}) => {
  const data = await prepareDeletionDataset(page, "m4d8-furniture-delete");
  const salon = roomCard(page, data.room.salon);
  const emptyFurnitureName = `Pusty Mebel ${Date.now()}`;
  await createEmptyFurniture(salon, emptyFurnitureName);

  let emptyFurniture = furnitureCard(salon, emptyFurnitureName);
  let opened = await openDeleteDialog(
    emptyFurniture,
    "Usuń Mebel",
    "Usuń Mebel",
  );
  await expectDependencyCount(opened.dialog, "Schowki", 0);
  await opened.dialog.getByRole("button", { name: "Anuluj" }).last().click();
  opened = await openDeleteDialog(emptyFurniture, "Usuń Mebel", "Usuń Mebel");
  await opened.dialog
    .getByRole("button", { name: "Usuń Mebel trwale" })
    .click();
  await expect(emptyFurniture).toHaveCount(0);
  await expect
    .soft(page.getByText("Mebel został usunięty.", { exact: true }))
    .toBeVisible();

  const kitchen = roomCard(page, data.room.kitchen);
  emptyFurniture = furnitureCard(kitchen, data.furniture.cabinet);
  opened = await openDeleteDialog(emptyFurniture, "Usuń Mebel", "Usuń Mebel");
  await expectDependencyCount(opened.dialog, "Schowki", 1);
  await expectDependencyCount(opened.dialog, "Łącznie Rzeczy", 0);
  await opened.dialog
    .getByRole("button", { name: "Usuń Mebel i jego Schowki" })
    .click();
  await expect(emptyFurniture).toHaveCount(0);
  await expect(kitchen).toBeVisible();
  await expect
    .soft(page.getByText("Mebel został usunięty.", { exact: true }))
    .toBeVisible();
});

test("M4D.8 shows a Furniture error, retries after login, then detaches Items", async ({
  page,
}) => {
  const data = await prepareDeletionDataset(page, "m4d8-furniture-detach");
  const salon = roomCard(page, data.room.salon);
  const chest = furnitureCard(salon, data.furniture.chest);
  const secondPage = await page.context().newPage();
  await secondPage.goto("/home");
  await secondPage.getByRole("button", { name: "Wyloguj" }).click();
  await expect(secondPage).toHaveURL(/\/login$/);

  await chest.getByRole("button", { name: "Usuń Mebel" }).click();
  const dialog = page.getByRole("dialog", { name: "Usuń Mebel" });
  await expect(
    dialog.getByText("Nie udało się usunąć Mebla.").first(),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Pobierz ponownie" }),
  ).toBeVisible();

  await login(secondPage, data.credentials);
  await secondPage.close();
  await dialog.getByRole("button", { name: "Pobierz ponownie" }).click();
  await expect(dialog.getByText("Ten Mebel zawiera Rzeczy.")).toBeVisible();
  await expectDependencyCount(dialog, "Schowki", 3);
  await expectDependencyCount(dialog, "Aktywne Rzeczy", 5);
  await expectDependencyCount(dialog, "Archiwalne Rzeczy", 1);
  await expectDependencyCount(dialog, "Łącznie Rzeczy", 6);
  await expectDependencyCount(dialog, "Łącznie przypisań", 6);
  await chooseResolution(dialog, "Pozostaw Rzeczy bez lokalizacji");
  await dialog.getByRole("button", { name: "Dalej" }).click();
  await dialog
    .getByRole("button", { name: "Odepnij Rzeczy i usuń Mebel" })
    .click();
  await expect(chest).toHaveCount(0);
  await expect(furnitureCard(salon, data.furniture.shelf)).toBeVisible();
  await expect
    .soft(page.getByText("Mebel został usunięty.", { exact: true }))
    .toBeVisible();

  await page.goto("/items?view=unlocated");
  for (const itemName of [
    data.item.charger,
    data.item.remote,
    data.item.warrantyDocuments,
    data.item.extension,
    data.item.jewelryBox,
  ]) {
    await expect(itemCard(page, itemName)).toContainText(
      "Brak przypisanej lokalizacji",
    );
  }
  await expect(itemCard(page, data.item.album)).toHaveCount(0);
});

test("M4D.8 moves Furniture Items, changes target and blocks submit while loading", async ({
  page,
}) => {
  const data = await prepareDeletionDataset(page, "m4d8-furniture-move");
  const salon = roomCard(page, data.room.salon);
  const chest = furnitureCard(salon, data.furniture.chest);
  const { dialog } = await openDeleteDialog(chest, "Usuń Mebel", "Usuń Mebel");
  await chooseResolution(dialog, "Przenieś Rzeczy do innego Schowka");
  const select = dialog.getByLabel("Wybierz docelowy Schowek");
  await expect(select).not.toContainText(data.furniture.chest);
  await selectTargetContaining(dialog, data.storageSpace.emptyKitchen);
  await selectTargetContaining(dialog, data.storageSpace.emptyShelf);
  await dialog.getByRole("button", { name: "Dalej" }).click();

  let releaseAction: (() => void) | undefined;
  let markHeld: (() => void) | undefined;
  const actionHeld = new Promise<void>((resolve) => {
    markHeld = resolve;
  });
  await page.route("**/home", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().headers()["next-action"] &&
      !releaseAction
    ) {
      markHeld?.();
      await new Promise<void>((resolve) => {
        releaseAction = resolve;
      });
    }
    await route.continue();
  });

  const finalButton = dialog.getByRole("button", {
    name: "Przenieś Rzeczy i usuń Mebel",
  });
  const submit = finalButton.click();
  await actionHeld;
  await expect(
    dialog.getByRole("button", { name: "Ładowanie zależności..." }),
  ).toBeDisabled();
  releaseAction?.();
  await submit;
  await expect(dialog).toBeHidden();
  await page.unroute("**/home");
  await expect(chest).toHaveCount(0);
  await expect
    .soft(page.getByText("Mebel został usunięty.", { exact: true }))
    .toBeVisible();

  await page.goto("/items");
  for (const itemName of [
    data.item.charger,
    data.item.remote,
    data.item.extension,
  ]) {
    await expect(itemCard(page, itemName)).toContainText(
      data.storageSpace.emptyShelf,
    );
  }
});

test("M4D.8 deletes an empty Storage space after cancel and retry", async ({
  page,
}) => {
  const data = await prepareDeletionDataset(page, "m4d8-storage-delete");
  const salon = roomCard(page, data.room.salon);
  const shelf = furnitureCard(salon, data.furniture.shelf);
  const emptyStorage = storageSpaceCard(shelf, data.storageSpace.emptyShelf);
  let opened = await openDeleteDialog(
    emptyStorage,
    "Usuń",
    "Usuń Schowek",
  );
  await opened.dialog.getByRole("button", { name: "Anuluj" }).last().click();
  await expect(emptyStorage).toBeVisible();

  opened = await openDeleteDialog(emptyStorage, "Usuń", "Usuń Schowek");
  await opened.dialog
    .getByRole("button", { name: "Usuń Schowek trwale" })
    .click();
  await expect(emptyStorage).toHaveCount(0);
  await expect(shelf).toBeVisible();
  await expect
    .soft(page.getByText("Schowek został usunięty.", { exact: true }))
    .toBeVisible();
  await page.reload();
  await expect(
    storageSpaceCard(
      furnitureCard(roomCard(page, data.room.salon), data.furniture.shelf),
      data.storageSpace.emptyShelf,
    ),
  ).toHaveCount(0);
});

test("M4D.8 detaches Storage-space Items and preserves the parent Furniture", async ({
  page,
}) => {
  const data = await prepareDeletionDataset(page, "m4d8-storage-detach");
  const salon = roomCard(page, data.room.salon);
  const chest = furnitureCard(salon, data.furniture.chest);
  const lowerDrawer = storageSpaceCard(chest, data.storageSpace.lowerDrawer);
  const { dialog } = await openDeleteDialog(
    lowerDrawer,
    "Usuń",
    "Usuń Schowek",
  );
  await expectDependencyCount(dialog, "Aktywne Rzeczy", 2);
  await expectDependencyCount(dialog, "Archiwalne Rzeczy", 1);
  await expectDependencyCount(dialog, "Łącznie Rzeczy", 3);
  await expectDependencyCount(dialog, "Łącznie przypisań", 3);
  await chooseResolution(dialog, "Pozostaw Rzeczy bez lokalizacji");
  await dialog.getByRole("button", { name: "Dalej" }).click();
  await dialog
    .getByRole("button", { name: "Odepnij Rzeczy i usuń Schowek" })
    .click();
  await expect(lowerDrawer).toHaveCount(0);
  await expect(chest).toBeVisible();
  await expect
    .soft(page.getByText("Schowek został usunięty.", { exact: true }))
    .toBeVisible();

  await page.goto("/items?view=unlocated");
  await expect(itemCard(page, data.item.warrantyDocuments)).toBeVisible();
  await expect(itemCard(page, data.item.jewelryBox)).toBeVisible();
  await page.goto("/items?view=archived");
  await expect(itemCard(page, data.item.oldDocument)).toContainText(
    "Brak przypisanej lokalizacji",
  );
});

test("M4D.8 moves Storage-space Items to another Room and persists after refresh", async ({
  page,
}) => {
  const data = await prepareDeletionDataset(page, "m4d8-storage-move");
  const salon = roomCard(page, data.room.salon);
  const chest = furnitureCard(salon, data.furniture.chest);
  const upperDrawer = storageSpaceCard(chest, data.storageSpace.upperDrawer);
  const { dialog } = await openDeleteDialog(
    upperDrawer,
    "Usuń",
    "Usuń Schowek",
  );
  await chooseResolution(dialog, "Przenieś Rzeczy do innego Schowka");
  const select = dialog.getByLabel("Wybierz docelowy Schowek");
  await expect(select).not.toContainText(data.storageSpace.upperDrawer);
  await selectTargetContaining(dialog, data.storageSpace.lowerDrawer);
  await selectTargetContaining(dialog, data.storageSpace.emptyKitchen);
  await dialog.getByRole("button", { name: "Dalej" }).click();
  await dialog
    .getByRole("button", { name: "Przenieś Rzeczy i usuń Schowek" })
    .click();
  await expect(upperDrawer).toHaveCount(0);
  await expect
    .soft(page.getByText("Schowek został usunięty.", { exact: true }))
    .toBeVisible();

  await page.goto("/items");
  for (const itemName of [
    data.item.charger,
    data.item.remote,
    data.item.extension,
  ]) {
    await expect(itemCard(page, itemName)).toContainText(
      `${data.room.kitchen} / ${data.furniture.cabinet} / ${data.storageSpace.emptyKitchen}`,
    );
  }
  await page.reload();
  await expect(itemCard(page, data.item.extension)).toContainText(
    data.storageSpace.emptyKitchen,
  );
});

test("M4D.8 isolates a second household from source data and move targets", async ({
  page,
}) => {
  const first = await prepareDeletionDataset(page, "m4d8-isolation-a");
  await page.getByRole("button", { name: "Wyloguj" }).click();
  await expect(page).toHaveURL(/\/login$/);
  const second = await prepareDeletionDataset(page, "m4d8-isolation-b");

  await page.goto("/home");
  await expect(page.getByText(first.room.salon, { exact: true })).toHaveCount(0);
  await expect(roomCard(page, second.room.salon)).toBeVisible();

  const secondSalon = roomCard(page, second.room.salon);
  const { dialog } = await openDeleteDialog(
    secondSalon,
    "Usuń Pomieszczenie",
    "Usuń Pomieszczenie",
  );
  await chooseResolution(dialog, "Przenieś Rzeczy do jednego Schowka");
  await expect(
    dialog.getByLabel("Wybierz docelowy Schowek"),
  ).not.toContainText(first.suffix);
  await dialog.getByRole("button", { name: "Anuluj" }).last().click();

  await page.goto("/items");
  await expect(
    page.getByText(first.item.charger, { exact: true }),
  ).toHaveCount(0);
  await expect(itemCard(page, second.item.charger)).toBeVisible();
});

test("M4D.8 keeps the deletion dialog usable at mobile, tablet and desktop widths", async ({
  page,
}) => {
  const data = await prepareDeletionDataset(page, "m4d8-responsive");

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const salon = roomCard(page, data.room.salon);
    const chest = furnitureCard(salon, data.furniture.chest);
    const upperDrawer = storageSpaceCard(chest, data.storageSpace.upperDrawer);
    const opened = await openDeleteDialog(
      upperDrawer,
      "Usuń",
      "Usuń Schowek",
    );
    const metrics = await opened.dialog.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        bottom: bounds.bottom,
        left: bounds.left,
        right: bounds.right,
        scrollWidth: element.scrollWidth,
        top: bounds.top,
        width: element.clientWidth,
      };
    });
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(viewport.width);
    expect(metrics.top).toBeGreaterThanOrEqual(0);
    expect(metrics.bottom).toBeLessThanOrEqual(viewport.height);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 1);
    await page.keyboard.press("Escape");
    await expect(opened.dialog).toBeHidden();
    await expect(opened.trigger).toBeFocused();
  }
});

test("M4D.8 member authorization requires an approved browser fixture", async () => {
  test.skip(
    true,
    "No member invitation/role-management UI or approved non-service-role E2E fixture exists.",
  );
});

test("M4D.8 child authorization requires an approved browser fixture", async () => {
  test.skip(
    true,
    "No child invitation/role-management UI or approved non-service-role E2E fixture exists.",
  );
});
