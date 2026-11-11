"use client";

import { useEffect, useId, useRef, useState, type Dispatch, type SetStateAction, type KeyboardEvent } from "react";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { EntityIcon } from "@/components/icons/entity-icon";
import { t } from "@/lib/i18n";
import { getPositionOptionsForStorage, getStorageOptionsForRoom, selectItemLocationRoom, selectItemLocationStorage, type ItemLocationSelectorOptions, type ItemLocationSelection } from "@/lib/items/item-options";

type Choice = { id: string; label: string; iconKey?: string | null };
type Group = "room" | "storage" | "position";

function IconSelect({ label, name, value, choices, placeholder, group, disabled, onChange }: {
  label: string; name: string; value: string; choices: Choice[]; placeholder: string;
  group: Group; disabled?: boolean; onChange: (value: string) => void;
}) {
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const all = [{ id: "", label: placeholder, iconKey: null }, ...choices];
  const selected = all.find((choice) => choice.id === value) ?? all[0];
  useEffect(() => {
    if (!open) return;
    function dismiss(event: MouseEvent) { if (!wrapper.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", dismiss);
    return () => document.removeEventListener("mousedown", dismiss);
  }, [open]);
  useEffect(() => { if (open) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" }); }, [active, id, open]);
  function close(restore = true) { setOpen(false); if (restore) trigger.current?.focus(); }
  function select(index: number) { onChange(all[index].id); close(); }
  function key(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape" && open) { event.preventDefault(); close(); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) { setActive(Math.max(0, all.findIndex((choice) => choice.id === value))); setOpen(true); }
      else setActive((current) => (current + (event.key === "ArrowDown" ? 1 : -1) + all.length) % all.length);
    } else if (open && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); select(active); }
    else if (open && event.key === "Tab") close(false);
  }
  return <div className="min-w-0" ref={wrapper}>
    <span id={`${id}-label`} className="ui-label">{label}</span>
    <input type="hidden" name={name} value={value} disabled={disabled} />
    <div className="relative mt-2">
      <button ref={trigger} type="button" role="combobox" data-location-field={name} className="ui-control flex w-full min-w-0 items-center gap-2 text-left disabled:opacity-60" disabled={disabled} aria-labelledby={`${id}-label ${id}-value`} title={selected.label} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={open ? `${id}-option-${active}` : undefined} onKeyDown={key} onClick={() => { setActive(Math.max(0, all.findIndex((choice) => choice.id === value))); setOpen(!open); }}>
        <EntityIcon group={group} iconKey={selected.iconKey} size={18} /><span id={`${id}-value`} className="min-w-0 flex-1 break-words whitespace-normal">{selected.label}</span><CaretDownIcon aria-hidden="true" size={16} weight="bold" className="shrink-0" />
      </button>
      {open && <div id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="absolute z-20 mt-1 max-h-60 w-full min-w-0 overflow-auto rounded-control border border-line bg-surface p-1 shadow-lg">
        {all.map((choice, index) => <div id={`${id}-option-${index}`} key={choice.id} role="option" aria-selected={choice.id === value} onMouseEnter={() => setActive(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => select(index)} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-2 text-sm ${active === index ? "bg-primary/10 text-primary-strong" : "text-foreground"}`}><EntityIcon group={group} iconKey={choice.iconKey} size={18} /><span className="min-w-0 break-words">{choice.label}</span></div>)}
      </div>}
    </div>
  </div>;
}

type LocationProps = {
  options: ItemLocationSelectorOptions;
  selection: ItemLocationSelection;
  setSelection: Dispatch<SetStateAction<ItemLocationSelection>>;
};

export function ItemLocationField({ options, selection, setSelection }: LocationProps) {
  const storageOptions = getStorageOptionsForRoom(options, selection.roomId);
  const positionOptions = getPositionOptionsForStorage(options, selection.storageId);
  return <fieldset className="min-w-0 max-w-full space-y-4 border-t border-line pt-5">
    <legend className="sr-only">{t.modules.items.location}</legend>
    <div><h3 className="text-lg font-semibold">{t.modules.items.locationHeading}</h3><p className="mt-1 text-sm text-muted">{t.modules.items.locationIntro}</p></div>
    <div className="grid min-w-0 grid-cols-2 gap-3">
      <IconSelect label={t.modules.items.room} name="room_id" group="room" placeholder={t.modules.items.chooseLocation} choices={options.rooms} value={selection.roomId} onChange={(id) => setSelection(selectItemLocationRoom(id))} />
      <IconSelect label={t.modules.items.storage} name="storage_location_l2_id" group="storage" placeholder={t.modules.items.chooseLocation} choices={storageOptions} value={selection.storageId} disabled={!selection.roomId || !storageOptions.length} onChange={(id) => setSelection((current) => selectItemLocationStorage(current, id))} />
      <div className="col-span-2"><IconSelect label={t.modules.items.position} name="storage_location_l3_id" group="position" placeholder={t.modules.items.chooseLocation} choices={positionOptions.map((entry) => ({...entry, label: entry.positionName}))} value={selection.positionId} disabled={!selection.storageId || !positionOptions.length} onChange={(id) => setSelection((current) => ({...current, positionId: id}))} /></div>
    </div>
  </fieldset>;
}

export function ItemLocationSummary({ options, selection }: Pick<LocationProps, "options" | "selection">) {
  const room = options.rooms.find((entry) => entry.id === selection.roomId);
  const storage = options.storageLocations.find((entry) => entry.id === selection.storageId);
  const position = options.positions.find((entry) => entry.id === selection.positionId);
  const path: { label: string; choice: Choice; group: Group }[] = [];
  if (room) path.push({ label: t.modules.items.room, choice: room, group: "room" });
  if (storage) path.push({ label: t.modules.items.storage, choice: storage, group: "storage" });
  if (position) path.push({ label: t.modules.items.position, choice: { ...position, label: position.positionName }, group: "position" });
  return <aside className="min-w-0 self-start rounded-control border border-line bg-white p-4" aria-live="polite">
    <h3 className="text-base font-semibold">{t.modules.items.selectedLocation}</h3>
    <p className="mt-1 text-sm text-muted">{t.modules.items.locationSummaryIntro}</p>
    {path.length ? <ol className="mt-4 space-y-3 border-l border-line pl-3">{path.map(({label, choice, group}) => <li className="flex items-start gap-2 text-sm" key={group}><span className="text-primary"><EntityIcon group={group} iconKey={choice.iconKey} size={20} /></span><span className="min-w-0 break-words"><span className="block text-xs text-muted">{label}</span>{choice.label}</span></li>)}</ol> : <p className="mt-4 text-sm font-medium text-primary-strong">{t.modules.items.noLocation}</p>}
    <p className="mt-4 text-sm text-muted">{t.modules.items.locationOptional}</p>
  </aside>;
}
