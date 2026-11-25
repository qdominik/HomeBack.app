import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { daylight } from "../../src/lib/ui/daylight";
import { expectFocusToken, expectPrimaryTextToken } from "./support/appearance";

test("focus and button contrast use the composited Oklab background", async ({ page }) => {
  await page.setContent(`
    <style>
      :root { --focus: #0d5f47; --on-primary: #fffdf8; }
      body { background: #ffffff; }
      .panel { background: color-mix(in oklab, #ece5d8 60%, transparent); padding: 20px; }
      a { display: block; outline: 2px solid var(--focus); outline-offset: 2px; }
      button { color: var(--on-primary); background: #0d5f47; }
    </style>
    <div class="panel"><a href="#target">Focus</a><button>Button</button></div>
  `);
  await expectFocusToken(page.getByRole("link", { name: "Focus" }));
  await expectPrimaryTextToken(page.getByRole("button", { name: "Button" }));
});

test("buttons and filter links have a visible hover indicator independent of fill color", async ({ page }) => {
  const css = readFileSync("src/components/ui/ui-control.css", "utf8");
  await page.setContent(`<style>${css}</style><style>:root { --focus: #0d5f47; }</style><button class="ui-button">Action</button><a class="ui-hover-indicator" href="#filter">Filter</a>`);
  const button = page.getByRole("button", { name: "Action" });
  await expect(button).toHaveCSS("box-shadow", "none");
  await button.hover();
  await expect(button).not.toHaveCSS("box-shadow", "none");
  const link = page.getByRole("link", { name: "Filter" });
  await expect(link).toHaveCSS("box-shadow", "none");
  await link.hover();
  await expect(link).not.toHaveCSS("box-shadow", "none");
});

test("accent links retain visible hover and focus feedback", async ({ page }) => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const linkRule = css.match(/a\.text-accent-text, summary\.text-accent-text\s*\{[^}]*\}/)?.[0];
  const hoverRule = css.match(/a\.text-accent-text:hover, summary\.text-accent-text:hover\s*\{[^}]*\}/)?.[0];
  expect(linkRule).toBeTruthy();
  expect(hoverRule).toBeTruthy();
  await page.setContent(`<style>:root { --primary-graphic:#0d5f47; --accent-soft:#ddf2df; --accent-soft-text:#0a3d30; --focus:#0d5f47 } ${linkRule} ${hoverRule} :focus-visible { outline: 2px solid var(--focus) }</style><a class="text-accent-text" href="#clear">Wyczyść filtry</a>`);
  const link = page.getByRole("link", { name: "Wyczyść filtry" });
  await expect(link).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await link.hover();
  await expect(link).toHaveCSS("background-color", "rgb(221, 242, 223)");
  await page.mouse.move(0, 0);
  await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  await expect(link).toHaveCSS("outline-width", "2px");
});

test("browser-composited surfaces retain accent text contrast every twilight minute", async ({ page }) => {
  const samples = [];
  for (let minute = 18 * 60 + 1; minute < 22 * 60 + 30; minute++) {
    const { styles } = daylight(minute / 60, "auto");
    for (const surface of ["background", "surface", "surface-muted"]) {
      for (const alpha of [0, 40, 60]) samples.push({ minute, surface, alpha, background: styles[`--${surface}`],
        overlay: styles["--surface-muted"], graphic: styles["--primary-graphic"], texts: [styles["--accent-text"], styles["--foreground"], styles["--foreground-muted"], styles["--foreground-secondary"]] });
    }
  }
  const rendered = await page.evaluate((values) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    const pixel = () => Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    return values.map(({ minute, surface, alpha, background, overlay, graphic, texts }) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = background;
      context.fillRect(0, 0, 1, 1);
      // Dashboard rows and fallback cards use 40% and 60% respectively.
      context.fillStyle = `color-mix(in oklab, ${overlay} ${alpha}%, transparent)`;
      context.fillRect(0, 0, 1, 1);
      const composite = pixel();
      const foregrounds = texts.map(text => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = text;
        context.fillRect(0, 0, 1, 1);
        return pixel();
      });
      context.clearRect(0, 0, 1, 1); context.fillStyle = graphic; context.fillRect(0, 0, 1, 1);
      return { minute, surface, alpha, composite, foregrounds, graphic: pixel() };
    });
  }, samples);
  const luminance = (channels: number[]) => channels.map(v => v / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, index) => sum + v * [.2126, .7152, .0722][index], 0);
  for (const sample of rendered) {
    const background = luminance(sample.composite);
    for (const color of sample.foregrounds) {
      const foreground = luminance(color);
      expect((Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05), `${sample.minute}: ${sample.surface} / ${sample.alpha}%`).toBeGreaterThanOrEqual(4.5);
    }
    const graphic = luminance(sample.graphic);
    expect((Math.max(graphic, background) + .05) / (Math.min(graphic, background) + .05), `${sample.minute}: primary border on ${sample.surface}`).toBeGreaterThanOrEqual(3);
  }
});

test("rendered status classes use recognizable dynamic roles and paired surfaces", async ({ page }) => {
  const tokens = readFileSync("src/styles/ui-tokens.css", "utf8");
  const globals = readFileSync("src/app/globals.css", "utf8");
  const rules = globals.match(/\.ui-status-(?:danger|warning|success|info)\s*\{[^}]*\}/g)?.join("\n");
  expect(rules).toBeTruthy();
  await page.setContent(`<style>${tokens}\n${rules}</style>${["success", "danger", "warning", "info"].map(role => `<p class="ui-status-${role}">${role}</p>`).join("")}`);
  const samples = Array.from({ length: 269 }, (_, i) => ({ minute: 1081 + i, ...daylight((1081 + i) / 60, "auto") }));
  const result = await page.evaluate((values) => {
    const root = document.documentElement;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const pixel = (color: string) => {
      context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    return values.flatMap(({ minute, theme, styles }) => {
      root.dataset.theme = theme;
      root.removeAttribute("style");
      for (const [name, color] of Object.entries(styles)) root.style.setProperty(name, color);
      return ["success", "danger", "warning", "info"].map(role => {
        const element = document.querySelector(`.ui-status-${role}`)!;
        const style = getComputedStyle(element);
        return { minute, role, text: pixel(style.color), surface: pixel(style.backgroundColor), token: pixel(getComputedStyle(root).getPropertyValue(`--${role}`).trim()) };
      });
    });
  }, samples);
  const luminance = (rgb: number[]) => rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  for (const { minute, role, text, surface, token } of result) {
    const a = luminance(text), b = luminance(surface);
    expect((Math.max(a, b) + .05) / (Math.min(a, b) + .05), `${minute} ${role}`).toBeGreaterThanOrEqual(4.5);
    expect(token, `${minute} ${role} exported token`).toEqual(text);
    const [r, g, b2] = token;
    const recognizablyColored = role === "success" ? g - Math.max(r, b2) >= 16 : role === "danger" ? r - Math.max(g, b2) >= 16 : role === "warning" ? r - g >= 8 && g - b2 >= 8 : b2 - r >= 16 && g > r;
    expect(recognizablyColored, `${minute} ${role} palette identity`).toBe(true);
  }
});
