import { expect, type Locator } from "@playwright/test";

function luminance(color: string) {
  const srgb = color.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  const channels = srgb
    ? srgb.slice(1, 4).map(value => Number(value) * 255)
    : color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Unsupported computed color: ${color}`);
  return channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(first: string, second: string) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function colors(locator: Locator, property: "outlineColor" | "color", token: string, outside: boolean) {
  return locator.evaluate((element, args) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${args.token})`;
    document.body.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    // Chromium returns color-mix(in oklab, ..., transparent) as oklab(),
    // including an alpha channel. Rasterize the actual stack instead of
    // treating Oklab coordinates as sRGB or ignoring the layer underneath.
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 1, 1);
    const ancestors: Element[] = [];
    let parent: Element | null = args.outside ? element.parentElement : element;
    while (parent) { ancestors.push(parent); parent = parent.parentElement; }
    for (const ancestor of ancestors.reverse()) {
      context.fillStyle = getComputedStyle(ancestor).backgroundColor;
      context.fillRect(0, 0, 1, 1);
    }
    const backgroundChannels = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    const actual = getComputedStyle(element)[args.property];
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = actual;
    context.fillRect(0, 0, 1, 1);
    const actualChannels = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    return { actual, expected, color: `rgb(${actualChannels.join(", ")})`, background: `rgb(${backgroundChannels.join(", ")})` };
  }, { property, token, outside });
}

export async function expectFocusToken(locator: Locator) {
  await expect.poll(async () => {
    const result = await colors(locator, "outlineColor", "--focus", true);
    return { token: result.actual === result.expected, visible: contrast(result.color, result.background) >= 3 };
  }).toEqual({ token: true, visible: true });
}

export async function expectPrimaryTextToken(locator: Locator) {
  await expect.poll(async () => {
    const result = await colors(locator, "color", "--on-primary", false);
    return { token: result.actual === result.expected, readable: contrast(result.color, result.background) >= 4.5 };
  }).toEqual({ token: true, readable: true });
}
