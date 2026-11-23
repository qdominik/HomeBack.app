"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useOptimistic, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelIcon } from "@phosphor-icons/react/dist/ssr/Funnel";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { MapPinLineIcon } from "@phosphor-icons/react/dist/ssr/MapPinLine";
import { EntityIcon } from "@/components/icons/entity-icon";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { t } from "@/lib/i18n";
import { parseItemSearchParams, type ItemFilters } from "@/lib/items/item-search-params";
import { parseItemView } from "@/lib/items/item-view-filter";
import { quickItemFilterSearch, type QuickItemSelection } from "@/lib/items/item-quick-filters";
import { routes } from "@/lib/routes";

type FilterOption = { id: string; label: string };

type ItemFiltersProps = {
  categories: FilterOption[];
  filters: ItemFilters;
  positions: FilterOption[];
  rooms: (FilterOption & { iconKey?: string | null })[];
  storageLocations: FilterOption[];
  view: string;
};

const selectClassName = "h-11 min-w-0 rounded-control border border-line bg-surface px-3 text-sm font-medium text-foreground outline-none focus:border-primary-graphic focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function ItemFilters({ categories, filters, positions, rooms, storageLocations, view }: ItemFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const committedSearch = searchParams.toString();
  const [isPending, startTransition] = useTransition();
  const [optimisticSearch, setOptimisticSearch] = useOptimistic(committedSearch);
  const intendedSearch = useRef(committedSearch);
  const [intentRevision, setIntentRevision] = useState(0);
  const latestIntentRevision = useRef(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterPanelId = useId();

  // An intermediate route must not become the base of the next user choice.
  // Next's navigation queue discards superseded responses; reconcile only when
  // the latest transition has settled, including external same-page links.
  // Reconcile during commit: a delayed passive effect from an earlier render
  // could otherwise overwrite an intent already recorded by a change event.
  useLayoutEffect(() => {
    // Strict Effects and a revealed tree can replay an older layout closure.
    // Only a render including the latest user intent may reconcile that intent.
    if (intentRevision !== latestIntentRevision.current) return;
    if (!isPending) intendedSearch.current = committedSearch;
  }, [committedSearch, isPending, intentRevision]);

  useEffect(() => {
    function restoreHistory() {
      const search = new URLSearchParams(window.location.search).toString();
      intendedSearch.current = search;
      const revision = ++latestIntentRevision.current;
      startTransition(() => {
        setIntentRevision(revision);
        setOptimisticSearch(search);
      });
    }
    window.addEventListener("popstate", restoreHistory);
    return () => window.removeEventListener("popstate", restoreHistory);
  }, [setOptimisticSearch]);

  const optimisticParams = Object.fromEntries(new URLSearchParams(optimisticSearch));
  const optimisticView = parseItemView(optimisticParams);
  const parsedFilters = parseItemSearchParams(optimisticParams);
  const activeFilters = optimisticSearch === committedSearch ? filters : {
    ...parsedFilters,
    status: optimisticParams.itemStatus
      ? parsedFilters.status
      : optimisticView === "archived" ? "archived" as const : "active" as const,
  };
  const activeView = optimisticSearch === committedSearch ? view : optimisticView;
  // Typing remains a draft until native form submission. Route changes to q
  // (chips, reset, history) replace it, while unrelated filters keep the draft.
  const [queryDraft, setQueryDraft] = useState({ source: activeFilters.query, value: activeFilters.query });
  if (queryDraft.source !== activeFilters.query) {
    setQueryDraft({ source: activeFilters.query, value: activeFilters.query });
  }

  function navigate(search: string, history: "push" | "replace" = "replace") {
    intendedSearch.current = search;
    const revision = ++latestIntentRevision.current;
    startTransition(() => {
      // Commit this snapshot with navigation, not in an urgent old-URL render.
      setIntentRevision(revision);
      setOptimisticSearch(search);
      const href = search ? `${routes.items}?${search}` : routes.items;
      router[history](href, { scroll: false });
    });
  }

  function filterSearch(name: string, value?: string, currentSearch = optimisticSearch) {
    const params = new URLSearchParams(currentSearch);
    params.delete("error");
    params.delete("focus");
    params.delete("status");
    if (name === "itemStatus") params.delete("view");
    if (value && value !== "active") params.set(name, value);
    else params.delete(name);
    if (name === "added" && value !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    return params.toString();
  }

  function filterHref(name: string) {
    const search = filterSearch(name);
    return search ? `${routes.items}?${search}` : routes.items;
  }

  function update(name: string, value: string) {
    navigate(filterSearch(name, value, intendedSearch.current));
  }

  function quickHref(selection: QuickItemSelection) {
    const search = quickItemFilterSearch(optimisticSearch, selection);
    return search ? `${routes.items}?${search}` : routes.items;
  }

  const shortcuts = [
    { selection: { kind: "all" } as QuickItemSelection, label: t.modules.items.views.all, icon: null, active: activeView === "all" && !activeFilters.roomId && activeFilters.status !== "archived", key: "all" },
    { selection: { kind: "unlocated" } as QuickItemSelection, label: t.modules.items.views.unlocated, icon: <MapPinLineIcon aria-hidden="true" size={20}/>, active: activeView === "unlocated", key: "unlocated" },
    ...rooms.map(room=>({selection: { kind: "room", id: room.id } as QuickItemSelection, label: room.label, icon: <EntityIcon group="room" iconKey={room.iconKey} size={22} weight="duotone"/>, active: activeFilters.roomId === room.id && activeView !== "unlocated", key: room.id})),
  ];

  function removeFilter(name: string) {
    if (name === "q") setQueryDraft({ source: "", value: "" });
    navigate(filterSearch(name, undefined, intendedSearch.current), "push");
  }

  function reset() {
    setFiltersOpen(false);
    setQueryDraft({ source: "", value: "" });
    navigate("", "push");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Preserve the native GET form's parameter rules and empty q, with current
    // optimistic selects/dates rather than the last committed server values.
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string") params.append(name, value);
    }
    setFiltersOpen(false);
    navigate(params.toString(), "push");
  }

  const chips = [
    activeFilters.query ? { key: "q", label: `“${activeFilters.query}”` } : null,
    activeFilters.categoryId ? { key: "category", label: categories.find((option) => option.id === activeFilters.categoryId)?.label ?? t.modules.items.category } : null,
    activeFilters.roomId ? { key: "room", label: rooms.find((option) => option.id === activeFilters.roomId)?.label ?? t.modules.items.room } : null,
    activeFilters.storageId ? { key: "storage", label: storageLocations.find((option) => option.id === activeFilters.storageId)?.label ?? t.modules.items.storage } : null,
    activeFilters.positionId ? { key: "position", label: positions.find((option) => option.id === activeFilters.positionId)?.label ?? t.modules.items.position } : null,
    activeFilters.status !== "active" ? { key: "itemStatus", label: activeFilters.status === "archived" ? t.modules.items.filterStatuses.archived : t.modules.items.filterStatuses.all } : null,
    activeFilters.added ? { key: "added", label: t.modules.items.addedOptions[activeFilters.added] } : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));

  return (
    <div className="min-w-0 space-y-4">
      <form action={routes.items} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3" method="get" onSubmit={submit}>
        {activeView !== "all" ? <input name="view" type="hidden" value={activeView} /> : null}
        {activeFilters.roomId ? <input name="room" type="hidden" value={activeFilters.roomId}/> : null}
        {activeFilters.sort !== "recent" ? <input name="sort" type="hidden" value={activeFilters.sort}/> : null}
        <div className="relative min-w-0">
        <label>
          <span className="sr-only">{t.modules.items.search}</span>
          <Input className="h-11 w-full rounded-control border border-line bg-surface py-2 pl-3 pr-12 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary-graphic focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" name="q" onChange={(event) => setQueryDraft({ source: activeFilters.query, value: event.currentTarget.value })} placeholder={t.modules.items.searchPlaceholder} type="search" unstyled value={queryDraft.value} />
        </label>
        <button aria-label={t.modules.items.search} title={t.modules.items.search} className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-control text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" type="submit">
          <MagnifyingGlassIcon aria-hidden="true" size={18} weight="bold" />
        </button>
        </div>
          <button type="button" aria-expanded={filtersOpen} aria-controls={filterPanelId} onClick={()=>setFiltersOpen(!filtersOpen)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-3 text-sm font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
            <FunnelIcon aria-hidden="true" size={18} />
            {t.modules.items.filtersLabel}
          </button>
          <div id={filterPanelId} className={`${filtersOpen ? "grid" : "hidden"} col-span-2 min-w-0 gap-4 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-3`}>
            <FilterSelect label={t.modules.items.category} name="category" options={categories} value={activeFilters.categoryId ?? ""} onChange={update} />
            <FilterSelect label={t.modules.items.storage} name="storage" options={storageLocations} value={activeFilters.storageId ?? ""} onChange={update} />
            <label className="ui-label">
              <span>{t.modules.items.position}</span>
              <Select className="mt-1" name="position" onChange={(event) => update("position", event.currentTarget.value)} value={activeFilters.positionId ?? ""}>
                <option value="">{t.modules.items.allPositions}</option>
                {positions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </Select>
            </label>
            <label className="ui-label">
              <span>{t.modules.items.status}</span>
              <Select className="mt-1" name="itemStatus" onChange={(event) => update("itemStatus", event.currentTarget.value)} value={activeFilters.status}>
                <option value="active">{t.modules.items.filterStatuses.active}</option>
                <option value="archived">{t.modules.items.filterStatuses.archived}</option>
                <option value="all">{t.modules.items.filterStatuses.all}</option>
              </Select>
            </label>
            <label className="ui-label">
              <span>{t.modules.items.addedTime}</span>
              <Select className="mt-1" name="added" onChange={(event) => update("added", event.currentTarget.value)} value={activeFilters.added ?? ""}>
                <option value="">{t.modules.items.anyTime}</option>
                <option value="today">{t.modules.items.addedOptions.today}</option>
                <option value="7d">{t.modules.items.addedOptions["7d"]}</option>
                <option value="30d">{t.modules.items.addedOptions["30d"]}</option>
                <option value="3m">{t.modules.items.addedOptions["3m"]}</option>
                <option value="custom">{t.modules.items.addedOptions.custom}</option>
              </Select>
            </label>
            {activeFilters.added === "custom" ? (
              <div className="grid grid-cols-2 gap-2">
                <label className="ui-label"><span>{t.modules.items.dateFrom}</span><Input className="mt-1" name="from" onChange={(event) => update("from", event.currentTarget.value)} type="date" value={activeFilters.dateFrom ?? ""} /></label>
                <label className="ui-label"><span>{t.modules.items.dateTo}</span><Input className="mt-1" name="to" onChange={(event) => update("to", event.currentTarget.value)} type="date" value={activeFilters.dateTo ?? ""} /></label>
              </div>
            ) : null}
          </div>
      </form>
      <nav aria-label={t.modules.items.viewSelector} className="flex min-w-0 gap-5 overflow-x-auto px-1 py-1">
        {shortcuts.map(shortcut=><Link
          aria-current={shortcut.active ? "page" : undefined}
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${shortcut.active ? "border-primary-graphic text-accent-text" : "border-transparent text-muted hover:text-foreground"}`}
          href={quickHref(shortcut.selection)} key={shortcut.key}
          onNavigate={event=>{event.preventDefault();navigate(quickItemFilterSearch(intendedSearch.current,shortcut.selection),"push");}}>
          {shortcut.icon}<span>{shortcut.label}</span>
        </Link>)}
      </nav>
      {chips.length ? (
        <div aria-label={t.modules.items.activeFilters} className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Link className="ui-hover-indicator inline-flex min-h-11 items-center gap-1 rounded-full border border-primary-graphic/30 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-soft-text hover:bg-accent-soft hover:text-accent-soft-text" href={filterHref(chip.key)} key={chip.key} onNavigate={(event) => { event.preventDefault(); removeFilter(chip.key); }}>
              {chip.label}<XIcon aria-hidden="true" size={14} />
            </Link>
          ))}
          <Link className="inline-flex min-h-11 items-center px-3 text-xs font-semibold text-accent-text hover:text-accent-text" href={routes.items} onNavigate={(event) => { event.preventDefault(); reset(); }}>{t.modules.items.clearFilters}</Link>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({ label, name, onChange, options, value }: { label: string; name: string; onChange: (name: string, value: string) => void; options: FilterOption[]; value: string }) {
  return (
    <label className="ui-label min-w-0">
      <span>{label}</span>
      <Select aria-label={label} className={`${selectClassName} w-full`} name={name} onChange={(event) => onChange(name, event.currentTarget.value)} unstyled value={value}>
        <option value="">{label}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </Select>
    </label>
  );
}
