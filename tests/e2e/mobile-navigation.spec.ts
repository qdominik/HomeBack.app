import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { buttonClassName } from "../../src/components/ui/button";
import { uiTokens } from "../../src/lib/ui/tokens";
import { registerAndCreateHousehold } from "./support/auth";
import { itemCard } from "./support/m4d8";

// Read static class expressions from the actual components rather than copying
// their classes into a fixture that could silently diverge from the application.
function componentClasses(file: string, tagOrVariable: string, attribute?: string): string[] {
  const source = ts.createSourceFile(file, readFileSync(resolve(__dirname, "../../src", file), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function strings(node: ts.Node): string[] {
    if (ts.isStringLiteral(node)) return [node.text];
    if (ts.isJsxExpression(node) && node.expression) return strings(node.expression);
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      return strings(node.left).flatMap(left => strings(node.right).map(right => left + right));
    }
    if (ts.isConditionalExpression(node)) return [...strings(node.whenTrue), ...strings(node.whenFalse)];
    throw new Error(`Expected a static class expression in ${file}`);
  }
  const result: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === tagOrVariable && node.initializer) result.push(...strings(node.initializer));
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === tagOrVariable) {
      const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
      if (!attribute || attributes.some(entry => entry.name.getText(source) === attribute)) {
        const className = attributes.find(entry => entry.name.getText(source) === "className");
        if (className?.initializer) result.push(...strings(className.initializer));
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  expect(result.length, `class expression for ${tagOrVariable} in ${file}`).toBeGreaterThan(0);
  return result;
}

test("personalization, icon picker and invitation fields have one keyboard indicator", async ({ page }, testInfo) => {
  await page.goto("/login");
  const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  expect(stylesheets.length).toBeGreaterThan(0);
  const css = await Promise.all(stylesheets.map(async href => {
    const response = await page.request.get(href);
    expect(response.ok()).toBe(true);
    return response.text();
  }));
  const toggle = componentClasses("app/(app)/settings/dashboard-personalization-content.tsx", "moduleToggleClassName")[0];
  const trigger = componentClasses("components/icons/entity-icon-picker.tsx", "button", "aria-controls")[0];
  const [selectedIcon, otherIcon] = componentClasses("components/icons/entity-icon-picker.tsx", "button", "title");
  const email = componentClasses("components/people/people-content.tsx", "input")[0];
  const role = componentClasses("components/people/people-content.tsx", "select")[0];
  const name = componentClasses("components/people/invitation-accept-form.tsx", "input")[0];
  // Isolated controls have no form actions or event handlers. Tab cannot send or
  // accept an invitation, save preferences, or change an icon in the application.
  const fixture = `<!doctype html><html><head><style>${css.join("\n")}</style></head><body><main class="p-6 max-w-lg grid grid-cols-2 gap-6">
    <input aria-label="Hidden module" type="checkbox" class="relative ${toggle}">
    <input aria-label="Visible module" type="checkbox" checked class="relative ${toggle}">
    <button type="button" class="${trigger}">Icon picker</button>
    <button type="button" aria-pressed="true" class="${selectedIcon}">Selected icon</button>
    <button type="button" aria-pressed="false" class="${otherIcon}">Other icon</button>
    <input aria-label="Invitation email" type="email" class="${email}">
    <select aria-label="Invitation role" class="${role}"><option>Adult</option></select>
    <input aria-label="Invitation name" class="${name}">
  </main></body></html>`;
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("about:blank");
    await page.setContent(fixture);
    for (const control of await page.locator("input, button, select").all()) {
      await page.keyboard.press("Tab");
      await expect(control).toBeFocused();
      await expect(control).toHaveCSS("outline-style", "solid");
      await expect(control).toHaveCSS("outline-width", "2px");
      await expect(control).toHaveCSS("outline-offset", "2px");
      await expect(control).toHaveCSS("outline-color", "rgb(27, 111, 77)");
      await expect(control).toHaveCSS("box-shadow", "none");
    }
    await expect(page.getByLabel("Visible module", { exact: true })).toBeChecked();
    await expect(page.getByLabel("Hidden module", { exact: true })).not.toBeChecked();
    await expect(page.getByRole("button", { name: "Selected icon", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Selected icon", exact: true })).toHaveCSS("border-color", "rgb(27, 111, 77)");
    await page.getByRole("button", { name: "Icon picker", exact: true }).click();
    await expect(page.getByRole("button", { name: "Icon picker", exact: true })).toHaveCSS("border-color", "rgb(27, 111, 77)");
    const roleControl = page.getByLabel("Invitation role", { exact: true });
    await roleControl.click();
    await expect(roleControl).toHaveCSS("border-color", "rgb(27, 111, 77)");
    if (!await roleControl.evaluate(element => element.matches(":focus-visible"))) {
      await expect(roleControl).not.toHaveCSS("box-shadow", "none");
    }
    await page.keyboard.press("Escape");
    await page.screenshot({ path: testInfo.outputPath(`focus-review-${width}.png`), fullPage: true });
  }
});

test("keyboard focus has one visible outline, including invalid controls", async ({ page }, testInfo) => {
  await page.goto("/login");
  const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll(
    links => links.map(link => (link as HTMLLinkElement).href),
  );
  expect(stylesheets.length).toBeGreaterThan(0);
  const css = await Promise.all(stylesheets.map(async href => {
    const response = await page.request.get(href);
    expect(response.ok()).toBe(true);
    return response.text();
  }));
  const markup = `<main class="p-6 space-y-6">
    <label for="invalid-focus">Invalid field</label>
    <input id="invalid-focus" class="ui-control" aria-invalid="true" aria-errormessage="invalid-focus-error" aria-describedby="invalid-focus-error" value="invalid">
    <p id="invalid-focus-error" role="alert">Check this value</p>
    <input class="ui-control" aria-label="Valid field">
    <a href="#result" class="${uiTokens.focusRing}">Dashboard result</a>
    <button class="${buttonClassName()}" type="button">Search</button>
  </main>`;
  // Exercise the real compiled app CSS, including the error-state cascade.
  const fixture = `<!doctype html><html><head><style>${css.join("\n")}</style></head><body>${markup}</body></html>`;
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("about:blank");
    await page.setContent(fixture);
    const controls = [page.getByLabel("Invalid field", { exact: true }), page.getByLabel("Valid field", { exact: true }),
      page.getByRole("link", { name: "Dashboard result" }), page.getByRole("button", { name: "Search" })];
    for (const control of controls) {
      await page.keyboard.press("Tab");
      await expect(control).toBeFocused();
      await expect(control).toHaveCSS("outline-style", "solid");
      await expect(control).toHaveCSS("outline-width", "2px");
      await expect(control).toHaveCSS("outline-offset", "2px");
      await expect(control).toHaveCSS("outline-color", "rgb(27, 111, 77)");
      await expect(control).toHaveCSS("box-shadow", "none");
      if (control === controls[0]) {
        await expect(control).toHaveCSS("border-color", "rgb(231, 76, 60)");
        await page.screenshot({ path: testInfo.outputPath(`focus-invalid-${width}.png`) });
      }
    }
    await expect(page.getByLabel("Invalid field", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Invalid field", { exact: true })).toHaveAttribute("aria-errormessage", "invalid-focus-error");
    await expect(page.getByLabel("Invalid field", { exact: true })).toHaveCSS("border-color", "rgb(231, 76, 60)");
    await expect(page.getByRole("alert")).toHaveText("Check this value");
  }
});

for (const width of [390, 768, 1280]) {
  test(`header and menu work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await registerAndCreateHousehold(page, `navigation-${width}`);
    const header = page.getByRole("banner");
    await expect(page.getByRole("main").getByRole("searchbox")).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("button", { name: "Dodaj przedmiot", exact: true })).toHaveCount(0);
    const toggle = header.getByRole("button", { name: /menu$/ });
    const menu = page.getByRole("navigation", { name: "Główna nawigacja" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(menu).not.toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAttribute("aria-controls", await menu.getAttribute("id") as string);
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "Osoby", exact: true })).toHaveAttribute("href", "/family");
    for (const name of ["Dokumenty"]) {
      const soon = menu.getByRole("button", { name: `${name} Wkrótce` });
      await expect(soon).toHaveAttribute("aria-disabled", "true");
      await soon.click({ force: true });
      await expect(page).toHaveURL(/\/dashboard$/);
    }
    for (const element of [header, menu]) {
      expect(await element.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      const bounds = await element.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    }
    await page.screenshot({ path: `test-results/authenticated-navigation-${width}.png`, fullPage: true });
    const logo = header.getByRole("link", { name: "HomeBack.app" });
    const logoBox = await logo.boundingBox();
    const addBox = await header.getByRole("button", { name: "Dodaj przedmiot", exact: true }).boundingBox();
    expect(logoBox!.x + logoBox!.width).toBeLessThanOrEqual(addBox!.x);
    expect(addBox!.width).toBeGreaterThanOrEqual(44);
    expect(addBox!.height).toBeGreaterThanOrEqual(44);
    const searchBox = await header.getByRole("button", { name: "Wyszukiwarka", exact: true }).boundingBox();
    expect(logoBox!.x + logoBox!.width).toBeLessThanOrEqual(searchBox!.x);
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await toggle.click();
    await expect(menu).not.toBeVisible();
    await toggle.click();
    await page.getByRole("main").click({ position: { x: 5, y: 5 } });
    await expect(menu).not.toBeVisible();
    for (const [name, href] of [["Rzeczy", "/items"], ["Pomieszczenia", "/home"], ["Kategorie", "/categories"], ["Ustawienia", "/settings"], ["Dashboard", "/dashboard"]]) {
      await toggle.click();
      await menu.getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(menu).not.toBeVisible();
      await toggle.click();
      await expect(menu.getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page");
      await page.keyboard.press("Escape");
    }
    await expect(logo).toHaveAttribute("href", "/dashboard");
    await logo.click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/items");
    await logo.click();
    await expect(page).toHaveURL(/\/dashboard$/);
    const search = header.getByRole("button", { name: "Wyszukiwarka", exact: true });
    const dialog = page.getByRole("dialog", { name: "Wyszukiwarka" });
    for (const close of ["text", "icon", "escape", "backdrop"]) {
      await search.click();
      await expect(dialog.getByRole("searchbox")).toBeFocused();
      for (const name of ["Wszystko", "Rzeczy", "Pomieszczenia", "Meble", "Schowki"]) {
        await expect(dialog.getByRole("button", { name, exact: true })).toBeInViewport();
      }
      if (close === "backdrop") await page.mouse.click(2, 2);
      else if (close === "escape") await page.keyboard.press("Escape");
      else await dialog.getByRole("button", { name: "Zamknij wyszukiwarkę", exact: true }).nth(close === "text" ? 0 : 1).click();
      await expect(dialog).not.toBeVisible();
      await expect(search).toBeFocused();
    }
    const add = header.getByRole("button", { name: "Dodaj przedmiot", exact: true });
    const color = await add.evaluate(el => getComputedStyle(el).backgroundColor);
    const [red, green, blue] = color.match(/\d+/g)!.map(Number);
    expect(green).toBeGreaterThan(red);
    expect(green).toBeGreaterThan(blue);
    await expect(add).toHaveCSS("color", "rgb(255, 255, 255)");
    const beforeAddURL = page.url();
    const itemsRequests: string[] = [];
    const trackItems = (request: import("@playwright/test").Request) => {
      if (new URL(request.url()).pathname === "/items") itemsRequests.push(request.url());
    };
    page.on("request", trackItems);
    const headerHeight = (await header.boundingBox())!.height;
    await add.click();
    const addDialog = page.getByRole("dialog", { name: "Dodaj przedmiot", exact: true });
    await expect(addDialog).toBeVisible();
    expect(page.url()).toBe(beforeAddURL);
    await expect(addDialog.locator('input[name="nazwa"]')).toBeFocused();
    expect(await addDialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect((await header.boundingBox())!.height).toBe(headerHeight);
    await page.screenshot({ path: `test-results/add-item-${width}.png`, fullPage: true });
    await page.keyboard.press("Escape");
    await expect(addDialog).not.toBeVisible();
    await expect(add).toBeFocused();
    expect(page.url()).toBe(beforeAddURL);
    await add.click();
    await expect(addDialog).toBeVisible();
    expect(page.url()).toBe(beforeAddURL);
    await addDialog.getByRole("button", { name: "Zamknij dodawanie przedmiotu" }).click();
    expect(page.url()).toBe(beforeAddURL);
    await add.click();
    page.off("request", trackItems);
    expect(itemsRequests).toEqual([]);
    await addDialog.locator('input[name="nazwa"]').fill(`Header item ${width}`);
    await addDialog.getByRole("button", { name: "Utwórz rzecz", exact: true }).click();
    await expect(page).toHaveURL(/status=item_created/);
    await expect(addDialog).not.toBeVisible();
    await expect(page.getByRole("heading", { name: `Header item ${width}`, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await toggle.click();
    await menu.getByRole("button", { name: "Wyloguj", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Logowanie", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Otwórz menu" }).click();
    await expect(menu.getByRole("link", { name: "Zaloguj", exact: true })).toHaveAttribute("href", "/login");
    await expect(menu.getByRole("button", { name: "Wyloguj" })).toHaveCount(0);
  });
}

test("JPEG upload through header add persists its thumbnail after reload and edit", async ({ page }) => {
  test.setTimeout(120_000);
  await registerAndCreateHousehold(page, "photo-regression");

  // Deterministic noise produces a real JPEG large enough to exercise compression.
  // Generate it with the browser encoder so this test needs no image dependency.
  const dataURL = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is unavailable");
    const pixels = context.createImageData(canvas.width, canvas.height);
    let seed = 0x12345678;
    for (let index = 0; index < pixels.data.length; index += 4) {
      for (let channel = 0; channel < 3; channel++) {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        pixels.data[index + channel] = seed & 255;
      }
      pixels.data[index + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
    return canvas.toDataURL("image/jpeg", 1);
  });
  expect(dataURL).toMatch(/^data:image\/jpeg;base64,/);
  const jpeg = Buffer.from(dataURL.split(",")[1], "base64");
  expect(jpeg.length).toBeGreaterThan(800 * 1024);

  await page.getByRole("banner").getByRole("button", { name: "Dodaj przedmiot", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Dodaj przedmiot", exact: true });
  const itemName = "JPEG dependency regression";
  await dialog.locator('input[name="nazwa"]').fill(itemName);
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "dependency-regression.jpg",
    mimeType: "image/jpeg",
    buffer: jpeg,
  });
  await expect(dialog.getByText("Zdjęcie gotowe do podglądu.", { exact: true })).toBeVisible();
  const preview = dialog.getByRole("img", { name: "Podgląd wybranego zdjęcia Rzeczy", exact: true });
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate((element: HTMLImageElement) =>
    element.complete && element.naturalWidth > 0 && element.naturalHeight > 0,
  )).toBe(true);
  const uploadedBytes = Number(await dialog.locator('input[name="item_photo_size_bytes"]').inputValue());
  expect(uploadedBytes).toBeGreaterThan(0);
  expect(uploadedBytes).toBeLessThanOrEqual(800 * 1024);
  expect(uploadedBytes).toBeLessThan(jpeg.length);

  await dialog.getByRole("button", { name: "Utwórz rzecz", exact: true }).click();
  await expect(page).toHaveURL(/status=item_created/);
  await expect(dialog).not.toBeVisible();
  const card = itemCard(page, itemName);
  const thumbnail = card.getByRole("img", { name: itemName, exact: true });
  await expect(thumbnail).toBeVisible();
  await expect.poll(() => thumbnail.evaluate((element: HTMLImageElement) =>
    element.complete && element.naturalWidth > 0 && element.naturalHeight > 0,
  )).toBe(true);
  await page.reload();
  await expect(thumbnail).toBeVisible();
  await expect.poll(() => thumbnail.evaluate((element: HTMLImageElement) =>
    element.complete && element.naturalWidth > 0 && element.naturalHeight > 0,
  )).toBe(true);

  await card.getByText("Edytuj rzecz", { exact: true }).click();
  const edit = card.locator("details form");
  const editPreview = edit.getByRole("img", { name: "Podgląd wybranego zdjęcia Rzeczy", exact: true });
  await expect(editPreview).toBeVisible();
  await expect.poll(() => editPreview.evaluate((element: HTMLImageElement) =>
    element.complete && element.naturalWidth > 0 && element.naturalHeight > 0,
  )).toBe(true);
  const editedName = `${itemName} edited`;
  await edit.locator('input[name="nazwa"]').fill(editedName);
  await edit.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
  await expect(page).toHaveURL(/status=item_updated/);
  await page.reload();
  const editedThumbnail = itemCard(page, editedName).getByRole("img", { name: editedName, exact: true });
  await expect(editedThumbnail).toBeVisible();
  await expect.poll(() => editedThumbnail.evaluate((element: HTMLImageElement) =>
    element.complete && element.naturalWidth > 0 && element.naturalHeight > 0,
  )).toBe(true);
});

test("guest menu and search controls fit mobile, tablet and desktop", async ({ page }) => {
  await page.goto("/login");
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const header = page.getByRole("banner");
    const menu = page.getByRole("navigation", { name: "Główna nawigacja" });
    const toggle = header.getByRole("button", { name: /menu$/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("link", { name: "Zaloguj", exact: true })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Wyloguj" })).toHaveCount(0);
    for (const element of [header, menu]) {
      expect(await element.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      const box = await element.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    await page.screenshot({ path: `test-results/navigation-${width}.png`, fullPage: true });
    await page.keyboard.press("Escape");
    await expect(toggle).toBeFocused();
    await expect(menu).not.toBeVisible();
    await toggle.click();
    await toggle.click();
    await expect(menu).not.toBeVisible();
    await toggle.click();
    await page.getByRole("heading", { name: "Logowanie" }).click();
    await expect(menu).not.toBeVisible();
    const trigger = header.getByRole("button", { name: "Wyszukiwarka", exact: true });
    const dialog = page.getByRole("dialog", { name: "Wyszukiwarka" });
    for (const close of ["text", "icon", "escape", "backdrop"]) {
      await trigger.click();
      await expect(dialog.getByRole("searchbox")).toBeFocused();
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      if (close === "backdrop") await page.mouse.click(2, 2);
      else if (close === "escape") await page.keyboard.press("Escape");
      else await dialog.getByRole("button", { name: "Zamknij wyszukiwarkę", exact: true }).nth(close === "text" ? 0 : 1).click();
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
    }
    await expect(header.getByRole("link", { name: "HomeBack.app" })).toHaveAttribute("href", "/dashboard");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
