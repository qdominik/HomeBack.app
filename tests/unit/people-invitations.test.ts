import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { invitationStatus, isInviteRole, normalizeInvitationEmail } from "../../src/lib/people/people";

test("invitation email is normalized and invalid input is rejected", () => {
  assert.equal(normalizeInvitationEmail("  USER@Example.com "), "user@example.com");
  assert.equal(normalizeInvitationEmail("invalid"), null);
});

test("only adult and child can be invitation roles", () => {
  assert.equal(isInviteRole("dorosły"), true);
  assert.equal(isInviteRole("dziecko"), true);
  assert.equal(isInviteRole("admin"), false);
});

test("pending invitation becomes expired in the UI without persisting a new status", () => {
  assert.equal(invitationStatus("pending", "2026-01-01T00:00:00.000Z", Date.parse("2026-01-02T00:00:00.000Z")), "expired");
  assert.equal(invitationStatus("accepted", "2026-01-01T00:00:00.000Z", Date.parse("2026-01-02T00:00:00.000Z")), "accepted");
});

test("revocation requires an in-app confirmation before it invokes the server action", () => {
  const source = readFileSync("src/components/people/people-content.tsx", "utf8");

  assert.equal(source.includes("window.confirm(\"Czy odwołać to zaproszenie?\")"), false);
  assert.equal(source.includes("setRevocationConfirmationId(invitation.id)"), true);
  assert.equal(source.includes("setRevocationConfirmationId(null)"), true);
  assert.equal(source.includes("act(() => revokeInvitation(invitation.id))"), true);
  assert.equal(source.includes("Potwierdź odwołanie"), true);
  assert.equal(source.includes("disabled={pending}"), true);
});
