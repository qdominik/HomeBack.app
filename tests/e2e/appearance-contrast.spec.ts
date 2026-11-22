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

test("browser-composited primary tint retains text contrast every twilight minute", async ({ page }) => {
  const samples = [];
  for (let minute = 18 * 60 + 1; minute < 22 * 60 + 30; minute++) {
    const { styles } = daylight(minute / 60, "auto");
    for (const surface of ["background", "surface", "surface-muted"]) {
      samples.push({ minute, surface, background: styles[`--${surface}`], tint: styles["--primary-tint"],
        primary: styles["--primary"], texts: [styles["--primary"], styles["--primary-hover"], styles["--primary-strong"], styles["--foreground"]] });
    }
  }
  const rendered = await page.evaluate((values) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    const pixel = () => Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    return values.map(({ minute, surface, background, tint, primary, texts }) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = background;
      context.fillRect(0, 0, 1, 1);
      context.fillStyle = `color-mix(in oklab, ${primary} ${tint}, transparent)`;
      context.fillRect(0, 0, 1, 1);
      const composite = pixel();
      const foregrounds = texts.map(text => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = text;
        context.fillRect(0, 0, 1, 1);
        return pixel();
      });
      return { minute, surface, composite, foregrounds };
    });
  }, samples);
  const luminance = (channels: number[]) => channels.map(v => v / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, index) => sum + v * [.2126, .7152, .0722][index], 0);
  for (const sample of rendered) for (const color of sample.foregrounds) {
    const a = luminance(color), b = luminance(sample.composite);
    expect((Math.max(a, b) + .05) / (Math.min(a, b) + .05), `${sample.minute}: ${sample.surface}`).toBeGreaterThanOrEqual(4.5);
  }
});
