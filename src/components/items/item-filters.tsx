"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelIcon } from "@phosphor-icons/react/dist/ssr/Funnel";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { t } from "@/lib/i18n";
import type { ItemFilters } from "@/lib/items/item-search-params";
import { routes } from "@/lib/routes";

type FilterOption = { id: string; label: string };

type ItemFiltersProps = {
  categories: FilterOption[];
  filters: ItemFilters;
  positions: FilterOption[];
  rooms: FilterOption[];
  storageLocations: FilterOption[];
  view: string;
};

const selectClassName = "h-11 min-w-0 rounded-control border border-line bg-surface px-3 text-sm font-medium text-foreground outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

export function ItemFilters({ categories, filters, positions, rooms, storageLocations, view }: ItemFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moreFilters = useRef<HTMLDetailsElement>(null);

  function filterHref(name: string, value?: string, currentSearch = searchParams.toString()) {
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
    const query = params.toString();
    return query ? `${routes.items}?${query}` : routes.items;
  }

  function update(name: string, value: string) {
    if (name !== "from" && name !== "to") moreFilters.current?.removeAttribute("open");
    router.replace(filterHref(name, value, window.location.search), { scroll: false });
  }

  const chips = [
    filters.query ? { key: "q", label: `“${filters.query}”` } : null,
    filters.categoryId ? { key: "category", label: categories.find((option) => option.id === filters.categoryId)?.label ?? t.modules.items.category } : null,
    filters.roomId ? { key: "room", label: rooms.find((option) => option.id === filters.roomId)?.label ?? t.modules.items.room } : null,
    filters.storageId ? { key: "storage", label: storageLocations.find((option) => option.id === filters.storageId)?.label ?? t.modules.items.storage } : null,
    filters.positionId ? { key: "position", label: positions.find((option) => option.id === filters.positionId)?.label ?? t.modules.items.position } : null,
    filters.status !== "active" ? { key: "itemStatus", label: filters.status === "archived" ? t.modules.items.filterStatuses.archived : t.modules.items.filterStatuses.all } : null,
    filters.added ? { key: "added", label: t.modules.items.addedOptions[filters.added] } : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));

  return (
    <div className="space-y-3">
      <form action={routes.items} className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-end" method="get">
        {view !== "all" ? <input name="view" type="hidden" value={view} /> : null}
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t.modules.items.search}</span>
          <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input className="h-11 w-full rounded-control border border-line bg-surface py-2 pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20" defaultValue={filters.query} name="q" placeholder={t.modules.items.searchPlaceholder} type="search" />
        </label>
        <FilterSelect label={t.modules.items.category} name="category" options={categories} value={filters.categoryId ?? ""} onChange={update} />
        <FilterSelect label={t.modules.items.room} name="room" options={rooms} value={filters.roomId ?? ""} onChange={update} />
        <FilterSelect label={t.modules.items.storage} name="storage" options={storageLocations} value={filters.storageId ?? ""} onChange={update} />
        <details className="relative min-w-0 lg:w-44 lg:shrink-0" ref={moreFilters}>
          <summary className={`${selectClassName} flex cursor-pointer list-none items-center justify-center gap-2 [&::-webkit-details-marker]:hidden`}>
            <FunnelIcon aria-hidden="true" size={18} />
            {t.modules.items.moreFilters}
          </summary>
          <div className="mt-2 grid gap-3 rounded-control border border-line bg-surface p-4 shadow-card lg:absolute lg:right-0 lg:top-full lg:z-20 lg:w-80">
            <label className="ui-label">
              <span>{t.modules.items.position}</span>
              <select className="ui-control mt-1" defaultValue={filters.positionId ?? ""} name="position" onChange={(event) => update("position", event.currentTarget.value)}>
                <option value="">{t.modules.items.allPositions}</option>
                {positions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </label>
            <label className="ui-label">
              <span>{t.modules.items.status}</span>
              <select className="ui-control mt-1" defaultValue={filters.status} name="itemStatus" onChange={(event) => update("itemStatus", event.currentTarget.value)}>
                <option value="active">{t.modules.items.filterStatuses.active}</option>
                <option value="archived">{t.modules.items.filterStatuses.archived}</option>
                <option value="all">{t.modules.items.filterStatuses.all}</option>
              </select>
            </label>
            <label className="ui-label">
              <span>{t.modules.items.addedTime}</span>
              <select className="ui-control mt-1" defaultValue={filters.added ?? ""} name="added" onChange={(event) => update("added", event.currentTarget.value)}>
                <option value="">{t.modules.items.anyTime}</option>
                <option value="today">{t.modules.items.addedOptions.today}</option>
                <option value="7d">{t.modules.items.addedOptions["7d"]}</option>
                <option value="30d">{t.modules.items.addedOptions["30d"]}</option>
                <option value="3m">{t.modules.items.addedOptions["3m"]}</option>
                <option value="custom">{t.modules.items.addedOptions.custom}</option>
              </select>
            </label>
            {filters.added === "custom" ? (
              <div className="grid grid-cols-2 gap-2">
                <label className="ui-label"><span>{t.modules.items.dateFrom}</span><input className="ui-control mt-1" defaultValue={filters.dateFrom ?? ""} name="from" onChange={(event) => update("from", event.currentTarget.value)} type="date" /></label>
                <label className="ui-label"><span>{t.modules.items.dateTo}</span><input className="ui-control mt-1" defaultValue={filters.dateTo ?? ""} name="to" onChange={(event) => update("to", event.currentTarget.value)} type="date" /></label>
              </div>
            ) : null}
          </div>
        </details>
      </form>
      {chips.length ? (
        <div aria-label={t.modules.items.activeFilters} className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Link className="inline-flex min-h-8 items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary-strong hover:bg-primary/10" href={filterHref(chip.key)} key={chip.key}>
              {chip.label}<XIcon aria-hidden="true" size={14} />
            </Link>
          ))}
          <Link className="inline-flex min-h-8 items-center px-2 text-xs font-semibold text-primary-strong hover:text-primary" href={routes.items}>{t.modules.items.clearFilters}</Link>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({ label, name, onChange, options, value }: { label: string; name: string; onChange: (name: string, value: string) => void; options: FilterOption[]; value: string }) {
  return (
    <label className="min-w-0 lg:w-44 lg:shrink-0">
      <span className="sr-only">{label}</span>
      <select aria-label={label} className={`${selectClassName} w-full`} defaultValue={value} name={name} onChange={(event) => onChange(name, event.currentTarget.value)}>
        <option value="">{label}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </label>
  );
}
