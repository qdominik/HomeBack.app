import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { areHouseholdInvitationsEnabled } from "../../src/lib/people/invitations-enabled";

test("household invitations are disabled unless the server flag is exactly true", () => {
  assert.equal(areHouseholdInvitationsEnabled({}), false);
  assert.equal(areHouseholdInvitationsEnabled({ HOUSEHOLD_INVITATIONS_ENABLED: "" }), false);
  assert.equal(areHouseholdInvitationsEnabled({ HOUSEHOLD_INVITATIONS_ENABLED: "TRUE" }), false);
  assert.equal(areHouseholdInvitationsEnabled({ HOUSEHOLD_INVITATIONS_ENABLED: "false" }), false);
  assert.equal(areHouseholdInvitationsEnabled({ HOUSEHOLD_INVITATIONS_ENABLED: "true" }), true);
});

test("all invitation server actions check the flag before calling RPC", () => {
  const source = readFileSync("src/app/(app)/family/actions.ts", "utf8");
  for (const action of ["prepareInvitation", "revokeInvitation", "renewInvitation"]) {
    const start = source.indexOf(`export async function ${action}`);
    const next = source.indexOf("export async function", start + 1);
    const body = source.slice(start, next === -1 ? undefined : next);
    assert.equal(body.indexOf("areHouseholdInvitationsEnabled()") < body.indexOf(".rpc("), true);
  }
});

test("member loading remains independent from invitation availability", () => {
  const page = readFileSync("src/app/(app)/family/page.tsx", "utf8");
  assert.equal(page.indexOf('supabase.rpc("get_household_members")') < page.indexOf("if (isAdministrator && invitationsEnabled)"), true);
});
