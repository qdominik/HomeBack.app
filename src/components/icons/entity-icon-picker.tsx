"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { EntityCatalogIcon } from "@/components/icons/entity-catalog-icon";
import { EntityIcon } from "@/components/icons/entity-icon";
import { getEntityIconDefinition, getEntityIconFallback, normalizeEntityIconValue, searchEntityIconOptions, type EntityIconGroup } from "@/lib/icons/entity-icon-validation";
import { paginatePhosphorIcons, searchPhosphorIcons } from "@/lib/icons/phosphor-icon-catalog";
import { activeLocale, t } from "@/lib/i18n";

type CatalogEntry = { name: string; search: string; group: number };
const PAGE_SIZE = 48;

type EntityIconPickerProps = {
  defaultValue?: string | null;
  dialogTitle?: string;
  group: EntityIconGroup;
  helpText?: string;
  label: string;
  name: string;
  onValueChange?: (value: string) => void;
  triggerLabel?: string;
  value?: string | null;
};

export function EntityIconPicker({ defaultValue, dialogTitle, group, helpText, label, name, onValueChange, triggerLabel, value }: EntityIconPickerProps) {
  const initialIconKey = normalizeEntityIconValue(defaultValue, group);
  const [uncontrolledIconKey, setUncontrolledIconKey] = useState(initialIconKey);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"defaults" | "all">("defaults");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [catalog, setCatalog] = useState<readonly CatalogEntry[] | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dialogTitleId = useId();
  const dialogId = useId();
  const locale = activeLocale;
  const selectedIconKey = normalizeEntityIconValue(value === undefined ? uncontrolledIconKey : value, group);
  const selectedDefinition = getEntityIconDefinition(selectedIconKey) ?? getEntityIconDefinition(getEntityIconFallback(group));
  const defaultOptions = useMemo(() => searchEntityIconOptions(query, group), [group, query]);
  const filteredCatalog = useMemo(() => {
    if (!catalog) return [];
    return searchPhosphorIcons(catalog, query);
  }, [catalog, query]);
  const pagedCatalog = paginatePhosphorIcons(filteredCatalog, page, PAGE_SIZE);
  const pageCount = pagedCatalog.totalPages;
  const currentPage = pagedCatalog.currentPage;
  const pageEntries = pagedCatalog.entries;
  const options = mode === "defaults" ? defaultOptions : pageEntries;
  useEffect(() => { if (mode === "all") searchRef.current?.focus(); }, [mode]);

  function openPicker() {
    dialogRef.current?.showModal();
    setMode("defaults"); setQuery(""); setPage(1); setIsOpen(true);
  }
  function closePicker() { dialogRef.current?.close(); setIsOpen(false); }
  async function showCatalog() {
    setMode("all"); setPage(1); setCatalogError(false); searchRef.current?.focus();
    if (catalog) return;
    setCatalogLoading(true);
    try {
      const registryModule = await import("@/lib/icons/phosphor-icon-registry");
      setCatalog(registryModule.PHOSPHOR_ICON_MANIFEST);
    } catch { setCatalogError(true); } finally { setCatalogLoading(false); }
  }
  function selectIcon(iconKey: string) {
    const nextIconKey = normalizeEntityIconValue(iconKey, group);
    if (value === undefined) setUncontrolledIconKey(nextIconKey);
    onValueChange?.(nextIconKey); closePicker();
  }

  return <fieldset className="space-y-2">
    <legend className="ui-label">{label}</legend>
    <input name={name} type="hidden" value={selectedIconKey} />
    <div className="flex items-center gap-3">
      <button aria-controls={dialogId} aria-expanded={isOpen} aria-label={triggerLabel ?? t.modules.home.iconPicker.change} className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-primary transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" onClick={openPicker} type="button"><EntityIcon group={group} iconKey={selectedIconKey} size={24} weight="duotone" /></button>
      <div className="min-w-0"><p className="text-sm font-semibold text-foreground">{selectedDefinition?.label[locale] ?? selectedIconKey}</p><p className="text-xs leading-5 text-muted">{helpText ?? t.modules.home.iconPicker.help}</p></div>
    </div>
    <dialog aria-labelledby={dialogTitleId} className="fixed inset-0 m-auto h-[min(36rem,calc(100vh-2rem))] w-[calc(100%-2rem)] max-w-xl rounded-card border border-line bg-surface p-0 text-foreground shadow-card backdrop:bg-foreground/35" id={dialogId} onClose={() => setIsOpen(false)} ref={dialogRef}>
      <div className="flex h-full min-h-0 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold" id={dialogTitleId}>{dialogTitle ?? t.modules.home.iconPicker.dialogTitle}</h2><button className="inline-flex min-h-11 items-center justify-center rounded-control px-3 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={closePicker} type="button">{t.modules.home.iconPicker.close}</button></div>
        <div className="mt-4 grid grid-cols-2 gap-2" role="tablist" aria-label={t.modules.home.iconPicker.dialogTitle}><button aria-pressed={mode === "defaults"} className="min-h-11 rounded-control border border-line px-2 text-sm font-semibold aria-pressed:border-primary aria-pressed:bg-primary/10" onClick={() => { setMode("defaults"); setQuery(""); setPage(1); }} type="button">{t.modules.home.iconPicker.defaults}</button><button aria-pressed={mode === "all"} className="min-h-11 rounded-control border border-line px-2 text-sm font-semibold aria-pressed:border-primary aria-pressed:bg-primary/10" onClick={showCatalog} type="button">{t.modules.home.iconPicker.allIcons}</button></div>
        {mode === "all" ? <label className="ui-label mt-3">{t.modules.home.iconPicker.search}<input ref={searchRef} className="ui-control mt-2" onChange={(event) => { setQuery(event.currentTarget.value); setPage(1); }} placeholder="AirplaneIcon" type="search" value={query} /></label> : null}
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {mode === "all" && catalogLoading ? <p aria-live="polite" className="text-sm text-muted">{t.modules.home.iconPicker.loading}</p> : null}
          {mode === "all" && catalogError ? <div className="space-y-2"><p className="text-sm text-muted" role="alert">{t.modules.home.iconPicker.noResults}</p><button className="min-h-11 rounded-control border border-line px-3 text-sm font-semibold" onClick={() => { setCatalog(null); void showCatalog(); }} type="button">{t.modules.home.iconPicker.retry}</button></div> : null}
          {!catalogLoading && !catalogError && options.length ? <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">{options.map((entry) => { const catalogEntry = entry as CatalogEntry; const key = mode === "defaults" && "key" in entry ? entry.key : catalogEntry.name; const selected = key === selectedIconKey; return <button aria-label={mode === "defaults" && "label" in entry ? entry.label[locale] : catalogEntry.name} aria-pressed={selected} className={selected ? "flex aspect-square min-h-11 items-center justify-center rounded-control border border-primary bg-primary/10 text-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" : "flex aspect-square min-h-11 items-center justify-center rounded-control border border-line bg-surface text-foreground transition-colors hover:border-primary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"} key={key} onClick={() => selectIcon(key)} title={mode === "all" ? catalogEntry.name : undefined} type="button">{mode === "defaults" ? <EntityIcon group={group} iconKey={key} size={22} weight={selected ? "duotone" : "regular"} /> : <EntityCatalogIcon iconName={catalogEntry.name} size={22} weight={selected ? "duotone" : "regular"} />}</button>; })}</div> : null}
          {!catalogLoading && !catalogError && !options.length ? <p className="text-sm text-muted">{t.modules.home.iconPicker.noResults}</p> : null}
        </div>
        {mode === "all" && catalog && !catalogLoading && !catalogError && filteredCatalog.length ? <div className="mt-3 flex items-center justify-between gap-2 text-sm"><button className="min-h-11 rounded-control border border-line px-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={currentPage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">{t.modules.home.iconPicker.previous}</button><span aria-live="polite">{t.modules.home.iconPicker.page} {currentPage} / {pageCount}</span><button className="min-h-11 rounded-control border border-line px-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={currentPage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} type="button">{t.modules.home.iconPicker.next}</button></div> : null}
      </div>
    </dialog>
  </fieldset>;
}
