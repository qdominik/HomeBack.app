"use client";

import Link from "next/link";
import { useId, useRef, useState, useTransition } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { searchGlobalObjects } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntityIcon } from "@/components/icons/entity-icon";
import { ItemPhotoThumbnail } from "@/components/items/item-photo-thumbnail";
import { t } from "@/lib/i18n";
import { GLOBAL_SEARCH_FILTERS, type GlobalSearchFilter, type GlobalSearchResponse } from "@/lib/global-search/search";

export function GlobalSearch({ onNavigate }: { onNavigate?: () => void }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GlobalSearchFilter>("all");
  const [response, setResponse] = useState<GlobalSearchResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const requestVersion = useRef(0);
  const copy = t.globalSearch;

  function submitSearch(nextFilter = filter) {
    const version = ++requestVersion.current;
    startTransition(async () => {
      try {
        const next = await searchGlobalObjects(query, nextFilter);
        if (version === requestVersion.current) setResponse(next);
      } catch {
        if (version === requestVersion.current) setResponse({ kind: "error" });
      }
    });
  }

  function changeQuery(value: string) {
    requestVersion.current += 1;
    setQuery(value);
    setResponse(null);
  }

  const results = !isPending && response?.kind === "success" ? response.results : [];
  const statusMessage = isPending ? copy.loading
    : response?.kind === "error" ? copy.error
    : response?.kind === "success" ? (results.length ? `${copy.results}: ${response.total}.` : copy.noResults)
    : query ? copy.ready : copy.initial;

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-md border border-line bg-surface p-4 shadow-card sm:p-5">
      <h2 className="text-lg font-semibold text-foreground" id={`${id}-title`}>{copy.title}</h2>
      <form className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); submitSearch(); }}>
        <label className="ui-label min-w-0 flex-1" htmlFor={`${id}-input`}>
          <span>{copy.label}</span>
          <input aria-describedby={`${id}-status`} className="ui-control mt-2" id={`${id}-input`} maxLength={100}
            onChange={(event) => changeQuery(event.currentTarget.value)} placeholder={copy.placeholder} type="search" value={query} />
        </label>
        <div className="flex gap-2 sm:shrink-0">
          {query ? <button aria-label={copy.clear} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-line bg-surface text-muted hover:border-primary focus-visible:outline-2 focus-visible:outline-primary" onClick={() => changeQuery("")} type="button"><XIcon aria-hidden="true" size={18} /></button> : null}
          <Button className="flex-1 sm:flex-none" disabled={isPending} type="submit"><MagnifyingGlassIcon aria-hidden="true" size={18} />{copy.submit}</Button>
        </div>
      </form>
      <div aria-label={copy.filter} className="mt-3 flex flex-wrap gap-2" role="group">
        {GLOBAL_SEARCH_FILTERS.map((value) => <button aria-pressed={filter === value} className={`min-h-11 rounded-control border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${filter === value ? "border-primary-hover bg-primary text-white" : "border-line bg-surface text-foreground hover:border-primary"}`} key={value} type="button" onClick={() => {
          setFilter(value);
          setResponse(null);
          submitSearch(value);
        }}>{copy.filters[value]}</button>)}
      </div>
      <p aria-live="polite" className="mt-4 text-sm text-muted" id={`${id}-status`} role="status">{statusMessage}</p>
      {!isPending && response?.kind === "error" ? <p className="mt-2 text-sm text-danger" role="alert">{copy.error}</p> : null}
      {results.length ? <ul aria-label={copy.results} className="mt-4 divide-y divide-line border-y border-line">
        {results.map((result) => <li key={`${result.type}-${result.id}`}>
          <Link className="block rounded-md py-3 outline-none hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary" href={result.href} onClick={onNavigate}>
            <span className="flex min-w-0 items-start gap-3">
              {result.type === "item" ? <ItemPhotoThumbnail alt={result.name} iconKey={result.icon ?? null} previewUrl={result.previewUrl ?? null} />
                : <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary"><EntityIcon group={result.type === "room" ? "room" : result.type === "furniture" ? "storage" : "position"} iconKey={result.icon} size={22} /></span>}
              <span className="min-w-0">
                <span className="block break-words font-semibold text-foreground">{result.name}</span>
                <Badge tone="primary">{copy.types[result.type]}</Badge>
                <span className="mt-1 block break-words text-sm leading-5 text-muted">{result.breadcrumb.length ? result.breadcrumb.join(" → ") : copy.noLocation}</span>
              </span>
            </span>
          </Link>
        </li>)}
      </ul> : null}
      {!isPending && response?.kind === "success" && response.total > results.length ? <p className="mt-3 text-sm text-muted">{copy.limited}</p> : null}
    </section>
  );
}

export function DashboardItemSearch() {
  return <GlobalSearch />;
}
