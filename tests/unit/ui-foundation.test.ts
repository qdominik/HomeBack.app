import assert from "node:assert/strict";
import test from "node:test";
import { uiTokenValues } from "../../src/lib/ui/tokens";
import { buttonVariants, stateVariants } from "../../src/lib/ui/variants";

test("design tokens keep the approved control geometry", () => {
  assert.equal(uiTokenValues.controlHeight, "2.75rem");
  assert.equal(uiTokenValues.radius, "0.5rem");
  assert.deepEqual(uiTokenValues.spacing, [
    "0.25rem",
    "0.5rem",
    "0.75rem",
    "1rem",
    "1.25rem",
    "1.5rem",
    "2rem",
    "2.5rem",
  ]);
});

test("button variants retain semantic actions", () => {
  assert.match(buttonVariants.primary, /bg-primary/);
  assert.match(buttonVariants.secondary, /border-line/);
  assert.match(buttonVariants.ghost, /text-primary/);
  assert.match(buttonVariants.danger, /bg-danger/);
});

test("empty, loading, and error states have distinct contracts", () => {
  assert.match(stateVariants.empty, /border-dashed/);
  assert.match(stateVariants.loading, /text-muted/);
  assert.match(stateVariants.error, /text-danger/);
});
