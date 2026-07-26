import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

type DialogContract = {
  path: string;
  mutation: string;
};

const dialogs: DialogContract[] = [
  {
    path: "src/components/home/storage-location-l3-delete-dialog.tsx",
    mutation: "deleteStorageLocationL3WithResolution",
  },
  {
    path: "src/components/home/storage-location-l2-delete-dialog.tsx",
    mutation: "deleteStorageLocationL2WithResolution",
  },
  {
    path: "src/components/home/room-delete-dialog.tsx",
    mutation: "deleteRoomWithResolution",
  },
];

function readDialog(path: string) {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

function sourceBetween(source: string, startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  assert.notEqual(start, -1, `${startMarker.trim()} exists`);
  assert.ok(end > start, `${startMarker.trim()} has a complete body`);

  return source.slice(start, end);
}

function exportedFunctionSource(source: string, name: string) {
  const start = source.indexOf(`export async function ${name}`);
  const next = source.indexOf("\nexport async function ", start + 1);

  assert.notEqual(start, -1, `${name} action exists`);

  return source.slice(start, next === -1 ? source.length : next);
}

test("M4D delete triggers stay enabled button controls in every dialog", () => {
  for (const { path } of dialogs) {
    const source = readDialog(path);
    const trigger = source.match(
      /<button[\s\S]*?onClick=\{openDialog\}[\s\S]*?<\/button>/,
    )?.[0];

    assert.match(source, /^"use client";/);
    assert.ok(trigger, `${path} renders the delete trigger`);
    assert.match(trigger, /type="button"/);
    assert.match(trigger, /ref=\{triggerRef\}/);
    assert.doesNotMatch(trigger, /disabled=/);
  }
});

test("opening every M4D dialog loads context without starting a mutation", () => {
  for (const { mutation, path } of dialogs) {
    const source = readDialog(path);
    const openDialog = sourceBetween(
      source,
      "  function openDialog()",
      "\n  function closeDialog()",
    );

    assert.match(openDialog, /dialog\.showModal\(\)/);
    assert.match(openDialog, /void loadContext\(\)/);
    assert.doesNotMatch(openDialog, new RegExp(`${mutation}\\(`));
  }
});

test("M4D dialogs select delete only for an empty dependency snapshot", () => {
  for (const { path } of dialogs) {
    const source = readDialog(path);
    const loadContext = sourceBetween(
      source,
      "  async function loadContext(",
      "\n  function openDialog()",
    );

    assert.match(loadContext, /totalLocationLinksCount === 0/);
    assert.match(loadContext, /setResolution\("delete"\)/);
    assert.doesNotMatch(loadContext, /setResolution\("(?:detach|move)"\)/);
  }
});

test("cancel, Escape and close restore focus without mutating data", () => {
  for (const { mutation, path } of dialogs) {
    const source = readDialog(path);
    const closeDialog = sourceBetween(
      source,
      "  function closeDialog()",
      "\n  function resetAfterClose()",
    );
    const resetAfterClose = sourceBetween(
      source,
      "  function resetAfterClose()",
      "\n  async function submitResolution()",
    );

    assert.match(closeDialog, /if \(!isSubmitting\)/);
    assert.match(closeDialog, /dialogRef\.current\?\.close\(\)/);
    assert.doesNotMatch(closeDialog, new RegExp(`${mutation}\\(`));
    assert.match(source, /onCancel=\{\(event\) => \{/);
    assert.match(source, /if \(isSubmitting\) \{\s+event\.preventDefault\(\)/);
    assert.match(source, /onClose=\{resetAfterClose\}/);
    assert.match(resetAfterClose, /triggerRef\.current\?\.focus\(\)/);
    assert.doesNotMatch(resetAfterClose, new RegExp(`${mutation}\\(`));
  }
});

test("every M4D dialog guards double submit and exposes loading and errors", () => {
  for (const { mutation, path } of dialogs) {
    const source = readDialog(path);
    const submitResolution = sourceBetween(
      source,
      "  async function submitResolution()",
      "\n  const summary",
    );

    assert.match(submitResolution, /isSubmitting/);
    assert.match(submitResolution, /setIsSubmitting\(true\)/);
    assert.match(submitResolution, new RegExp(`await ${mutation}\\(`));
    assert.match(source, /aria-busy=\{isLoading \|\| isSubmitting\}/);
    assert.match(source, /role="status"/);
    assert.match(source, /\{copy\.retry\}/);
    assert.match(source, /\{copy\.error\}/);
    assert.match(source, /isSubmitting \? copy\.loading : finalLabel/);
  }
});

test("DELETE, DETACH and MOVE share one visible success redirect per entity", () => {
  const actions = readFileSync("src/app/(app)/home/actions.ts", "utf8").replace(
    /\r\n/g,
    "\n",
  );
  const homePage = readFileSync("src/app/(app)/home/page.tsx", "utf8").replace(
    /\r\n/g,
    "\n",
  );
  const contracts = [
    ["deleteRoomWithResolution", "room_deleted"],
    ["deleteStorageLocationL2WithResolution", "location_deleted"],
    ["deleteStorageLocationL3WithResolution", "position_deleted"],
  ] as const;

  for (const [actionName, status] of contracts) {
    const action = exportedFunctionSource(actions, actionName);
    const statusRedirect = new RegExp(`redirectWithStatus\\("${status}"\\)`, "g");

    assert.equal(
      action.match(statusRedirect)?.length ?? 0,
      1,
      `${actionName} has one success redirect`,
    );
    assert.match(action, /if \(error\)/);
    assert.match(action, /return result;/);
    assert.match(action, /if \(!row\)/);
    assert.match(action, /p_resolution/);
    assert.match(action, /revalidatePath\(routes\.home\)/);
  }

  assert.match(homePage, /room_deleted: t\.modules\.home\.statuses\.roomDeleted/);
  assert.match(homePage, /location_deleted: t\.modules\.home\.statuses\.locationDeleted/);
  assert.match(homePage, /position_deleted: t\.modules\.home\.statuses\.positionDeleted/);
  assert.match(homePage, /<Alert variant="success">\{statusMessage\}<\/Alert>/);

  for (const { path } of dialogs) {
    assert.doesNotMatch(readDialog(path), /redirectWithStatus/);
  }
});
