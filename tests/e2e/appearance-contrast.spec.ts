import { test } from "@playwright/test";
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
