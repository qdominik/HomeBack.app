import assert from "node:assert/strict";
import test from "node:test";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Input } from "../../src/components/ui/input";
import { LoadingState } from "../../src/components/ui/loading-state";
import { Select } from "../../src/components/ui/select";

function openingTag(markup: string, element: "input" | "select") {
  const match = markup.match(new RegExp(`<${element}\\b[^>]*>`));
  assert.ok(match, `Expected rendered ${element}`);
  return match[0];
}

test("Input preserves native search, label, error, disabled, and ref contracts", () => {
  const ref = createRef<HTMLInputElement>();
  const markup = renderToStaticMarkup(
    <label htmlFor="global-search">
      Search
      <Input
        aria-describedby="search-help search-error"
        aria-errormessage="search-error"
        aria-invalid="true"
        defaultValue="latarka"
        disabled
        id="global-search"
        maxLength={100}
        name="q"
        ref={ref}
        required
        type="search"
      />
    </label>,
  );
  const input = openingTag(markup, "input");

  assert.match(markup, /<label for="global-search">/);
  assert.match(input, /type="search"/);
  assert.match(input, /id="global-search"/);
  assert.match(input, /name="q"/);
  assert.match(input, /aria-describedby="search-help search-error"/);
  assert.match(input, /aria-errormessage="search-error"/);
  assert.match(input, /aria-invalid="true"/);
  assert.match(input, /disabled/);
  assert.match(input, /required/);
  assert.match(input, /class="ui-control"/);
  assert.equal(ref.current, null);
});

test("Input supports an unstyled escape hatch without leaking it to the DOM", () => {
  const input = openingTag(
    renderToStaticMarkup(
      <Input aria-label="Search" className="specialized-search" unstyled />,
    ),
    "input",
  );

  assert.match(input, /aria-label="Search"/);
  assert.match(input, /class="specialized-search"/);
  assert.doesNotMatch(input, /ui-control|unstyled/);
});

test("Select preserves native options, label, disabled, and ref contracts", () => {
  const ref = createRef<HTMLSelectElement>();
  const markup = renderToStaticMarkup(
    <label htmlFor="scope">
      Scope
      <Select
        aria-describedby="scope-help"
        defaultValue="rooms"
        disabled
        id="scope"
        name="scope"
        ref={ref}
      >
        <option value="all">All</option>
        <option value="rooms">Rooms</option>
      </Select>
    </label>,
  );
  const select = openingTag(markup, "select");

  assert.match(markup, /<label for="scope">/);
  assert.match(select, /id="scope"/);
  assert.match(select, /name="scope"/);
  assert.match(select, /aria-describedby="scope-help"/);
  assert.match(select, /disabled/);
  assert.match(select, /class="ui-control"/);
  assert.match(markup, /<option value="rooms" selected="">Rooms<\/option>/);
  assert.equal(ref.current, null);
});

test("LoadingState announces an active loading status by default", () => {
  const markup = renderToStaticMarkup(
    <LoadingState className="mt-4">Loading items</LoadingState>,
  );

  assert.match(markup, /role="status"/);
  assert.match(markup, /aria-live="polite"/);
  assert.match(markup, /aria-busy="true"/);
  assert.match(markup, />Loading items<\/div>/);
});
