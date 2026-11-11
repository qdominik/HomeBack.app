import assert from "node:assert/strict";
import test from "node:test";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Input } from "../../src/components/ui/input";
import { LoadingState } from "../../src/components/ui/loading-state";
import { Select } from "../../src/components/ui/select";
import { Field } from "../../src/components/ui/field";
import { ControlGroup } from "../../src/components/ui/control-group";
import { Dialog } from "../../src/components/ui/dialog";
import { Textarea } from "../../src/components/ui/textarea";

function openingTag(markup: string, element: "input" | "select") {
  const match = markup.match(new RegExp(`<${element}\\b[^>]*>`));
  assert.ok(match, `Expected rendered ${element}`);
  return match[0];
}

test("Input preserves native search, label, error, and disabled attributes", () => {
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
  assert.match(input, /value="latarka"/);
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

test("Select preserves native options, label, and disabled attributes", () => {
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
});

test("native controls forward controlled values, change handlers, and refs unchanged", () => {
  const inputRef = createRef<HTMLInputElement>();
  const selectRef = createRef<HTMLSelectElement>();
  const onChange = () => {};
  const input = Input({ name: "q", value: "latarka", onChange, ref: inputRef });
  const select = Select({ name: "category", value: "tools", onChange, ref: selectRef, required: true });
  for (const control of [input, select]) assert.equal(control.props.onChange, onChange);
  assert.equal(input.props.ref, inputRef);
  assert.equal(input.props.value, "latarka");
  assert.equal(select.props.ref, selectRef);
  assert.equal(select.props.value, "tools");
  assert.equal(select.props.required, true);
});

test("Field links label, description, and error while retaining external descriptions", () => {
  const markup = renderToStaticMarkup(
    <Field id="item-name" label="Name" description="Use a unique name" error="Name is required" describedBy="form-status">
      {(props) => <Input {...props} name="name" required />}
    </Field>,
  );
  const input = openingTag(markup, "input");
  assert.match(markup, /<label[^>]*for="item-name"/);
  assert.match(input, /aria-describedby="form-status item-name-help item-name-error"/);
  assert.match(input, /aria-invalid="true"/);
  assert.match(input, /aria-errormessage="item-name-error"/);
  assert.match(markup, /id="item-name-help"/);
  assert.match(markup, /id="item-name-error" role="alert"/);
});

test("Field generates distinct IDs and omits references to absent descriptions or errors", () => {
  const markup = renderToStaticMarkup(<>
    <Field label="First">{(props) => <Input {...props} />}</Field>
    <Field label="Second" error="" description={false}>{(props) => <Select {...props}><option>All</option></Select>}</Field>
  </>);
  const ids = [...markup.matchAll(/(?:^|\s)id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
  for (const id of ids) assert.ok(markup.includes(`for="${id}"`));
  assert.doesNotMatch(markup, /aria-describedby|aria-invalid|aria-errormessage/);
});

test("ControlGroup keeps native fieldset disabling and legend semantics", () => {
  const markup = renderToStaticMarkup(<ControlGroup legend="Location" disabled><Input name="room" /></ControlGroup>);
  assert.match(markup, /<fieldset disabled=""/);
  assert.match(markup, /<legend[^>]*>Location<\/legend>/);
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

test("Dialog forwards its native ref and lifecycle guards to the caller", () => {
  const ref = createRef<HTMLDialogElement>();
  const onCancel = () => {};
  const onClose = () => {};
  const dialog = Dialog({ ref, onCancel, onClose, "aria-labelledby": "copy-title", "aria-describedby": "copy-description", size: "wide" });
  assert.equal(dialog.type, "dialog");
  assert.equal(dialog.props.ref, ref);
  assert.equal(dialog.props.onCancel, onCancel);
  assert.equal(dialog.props.onClose, onClose);
  assert.equal(dialog.props["aria-labelledby"], "copy-title");
  assert.equal(dialog.props["aria-describedby"], "copy-description");
  assert.equal(dialog.props.open, undefined, "The shell must not override showModal ownership");
});

test("Textarea retains controlled editing and native validation attributes", () => {
  const ref = createRef<HTMLTextAreaElement>();
  const onChange = () => {};
  const textarea = Textarea({ ref, onChange, value: "Zapasowe baterie", name: "opis", required: true, maxLength: 1000, rows: 4 });
  assert.equal(textarea.props.ref, ref);
  assert.equal(textarea.props.onChange, onChange);
  assert.equal(textarea.props.value, "Zapasowe baterie");
  assert.equal(textarea.props.name, "opis");
  assert.equal(textarea.props.required, true);
  assert.equal(textarea.props.maxLength, 1000);
  assert.equal(textarea.props.rows, 4);
});

test("Textarea works with Field error and label associations", () => {
  const markup = renderToStaticMarkup(<Field id="notes" label="Notatka" error="Uzupełnij notatkę">{props => <Textarea {...props} name="opis" defaultValue="" />}</Field>);
  assert.match(markup, /<label[^>]*for="notes"/);
  assert.match(markup, /<textarea[^>]*aria-describedby="notes-error"/);
  assert.match(markup, /<textarea[^>]*aria-invalid="true"/);
  assert.match(markup, /<textarea[^>]*aria-errormessage="notes-error"/);
});
