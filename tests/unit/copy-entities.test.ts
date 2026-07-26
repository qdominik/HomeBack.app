import assert from "node:assert/strict";
import test from "node:test";
import { copyDefaults, defaultCopyName, isCopyTargetValid, nextCopyName } from "../../src/lib/home/copy-entities";

test("copy names use readable numbered suffixes", () => {
  assert.equal(defaultCopyName("Salon"), "Salon — kopia");
  assert.equal(nextCopyName("Salon", ["Salon — kopia"]), "Salon — kopia 2");
  assert.equal(nextCopyName("Salon", ["Salon — kopia", "Salon — kopia 2"]), "Salon — kopia 3");
});

test("copy defaults keep structure options enabled only where applicable", () => {
  assert.equal(copyDefaults("room").copyStructure, true);
  assert.equal(copyDefaults("furniture").copyStorage, true);
  assert.equal(copyDefaults("storage").copyStorage, false);
  assert.equal(copyDefaults("item").targetId, null);
});

test("copy target validation allows unlocated items", () => {
  assert.equal(isCopyTargetValid("item", null), true);
  assert.equal(isCopyTargetValid("storage", null), false);
});
