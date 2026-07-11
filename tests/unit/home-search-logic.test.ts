import assert from "node:assert/strict";
import test from "node:test";
import {
  filterHomeStructure,
  parseHomeSearchParams,
  type SearchableRoom,
} from "../../src/lib/home/home-search";

const rooms: SearchableRoom[] = [
  {
    id: "room-salon",
    nazwa: "Salon",
    typ: "Salon",
    locations: [
      {
        id: "storage-komoda",
        nazwa: "Komoda",
        typ: "Komoda",
        positions: [
          {
            id: "position-szuflada",
            nazwa: "Szuflada górna",
            kod_lokalizacji: "SAL-KOM-SZU1",
          },
          {
            id: "position-dolna",
            nazwa: "Szuflada dolna",
            kod_lokalizacji: "SAL-KOM-SZU2",
          },
        ],
      },
      {
        id: "storage-regal",
        nazwa: "Regał",
        typ: "Regał",
        positions: [
          {
            id: "position-polka",
            nazwa: "Półka książki",
            kod_lokalizacji: "SAL-REG-POL1",
          },
        ],
      },
    ],
  },
];

function search(q: string, scope = "all") {
  return filterHomeStructure(rooms, parseHomeSearchParams({ q, scope }));
}

test("home search finds rooms case-insensitively and preserves their contents", () => {
  const results = search("sALOn");

  assert.equal(results.length, 1);
  assert.equal(results[0].locations.length, 2);
});

test("home search ignores Polish characters and repeated spaces", () => {
  const results = search("  REGAL   ");

  assert.equal(results.length, 1);
  assert.equal(results[0].locations.length, 1);
  assert.equal(results[0].locations[0].nazwa, "Regał");
});

test("storage search preserves the room context and only matching storage", () => {
  const results = search("komoda", "storage");

  assert.equal(results.length, 1);
  assert.equal(results[0].nazwa, "Salon");
  assert.deepEqual(results[0].locations.map((location) => location.nazwa), ["Komoda"]);
  assert.equal(results[0].locations[0].positions.length, 2);
});

test("position search preserves room and storage context", () => {
  const results = search("szuflada gorna", "positions");

  assert.equal(results.length, 1);
  assert.equal(results[0].locations.length, 1);
  assert.equal(results[0].locations[0].nazwa, "Komoda");
  assert.deepEqual(
    results[0].locations[0].positions.map((position) => position.nazwa),
    ["Szuflada górna"],
  );
});

test("home search finds a position by its location code", () => {
  const results = search("SAL-KOM-SZU1");

  assert.equal(results[0].locations[0].positions[0].kod_lokalizacji, "SAL-KOM-SZU1");
});

test("room scope omits storage and position matches", () => {
  const results = search("salon", "rooms");

  assert.equal(results.length, 1);
  assert.equal(results[0].locations.length, 0);
});

test("home search returns an empty structure when nothing matches", () => {
  assert.deepEqual(search("kotłownia"), []);
});
