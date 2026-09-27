import assert from "node:assert/strict";
import test from "node:test";
import { isAdultProfileRole } from "../../src/lib/auth/profile-role";
import { canCopyEntity } from "../../src/lib/copy-entities/copy-contract";
import { isDashboardModuleVisibleForRole } from "../../src/lib/dashboard/module-access";

const adultRestrictedModule = {
  key: "adult-only",
  requiredRoles: ["dorosły" as const],
};

test("pre-0024 domownik remains an adult during the application transition", () => {
  assert.equal(isAdultProfileRole("domownik"), true);
  assert.equal(canCopyEntity("item", "domownik"), true);
  assert.equal(
    isDashboardModuleVisibleForRole(adultRestrictedModule, "domownik"),
    true,
  );
});

test("post-0024 dorosły retains the same adult access", () => {
  assert.equal(isAdultProfileRole("dorosły"), true);
  assert.equal(canCopyEntity("item", "dorosły"), true);
  assert.equal(
    isDashboardModuleVisibleForRole(adultRestrictedModule, "dorosły"),
    true,
  );
});

test("child and unknown roles do not gain adult access", () => {
  assert.equal(isAdultProfileRole("dziecko"), false);
  assert.equal(isAdultProfileRole("unknown"), false);
  assert.equal(canCopyEntity("item", "dziecko"), false);
  assert.equal(
    isDashboardModuleVisibleForRole(adultRestrictedModule, "dziecko"),
    false,
  );
});
