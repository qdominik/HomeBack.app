"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { searchDashboardItems } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import {
  resolveDashboardItemSearchView,
  type DashboardItemSearchResponse,
} from "@/lib/items/item-search";
import { routes } from "@/lib/routes";

export function DashboardItemSearch() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<DashboardItemSearchResponse | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const view = resolveDashboardItemSearchView({
    isLoading: isPending,
    response,
  });

  function submitSearch() {
    startTransition(async () => {
      try {
        const nextResponse = await searchDashboardItems(query);
        setResponse(nextResponse);
      } catch {
        setResponse({ kind: "error" });
      }
    });
  }

  function clearSearch() {
    setQuery("");
    setResponse(null);
  }

  const statusMessage =
    view === "loading"
      ? t.dashboard.itemSearch.loading
      : view === "error"
        ? t.dashboard.itemSearch.error
        : view === "no-results"
          ? t.dashboard.itemSearch.noResults
          : t.dashboard.itemSearch.initial;

  return (
    <section aria-labelledby="dashboard-item-search-title" className="rounded-md border border-line bg-surface p-4 shadow-card sm:p-5">
      <h2 className="text-lg font-semibold text-foreground" id="dashboard-item-search-title">
        {t.dashboard.itemSearch.title}
      </h2>
      <form
        className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <label className="ui-label min-w-0 flex-1" htmlFor="dashboard-item-search-input">
          <span>{t.dashboard.itemSearch.label}</span>
          <input
            aria-describedby="dashboard-item-search-status"
            className="ui-control mt-2"
            id="dashboard-item-search-input"
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setResponse(null);
            }}
            placeholder={t.dashboard.itemSearch.placeholder}
            type="search"
            value={query}
          />
        </label>
        <div className="flex gap-2 sm:shrink-0">
          {query ? (
            <button
              aria-label={t.dashboard.itemSearch.clear}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-line bg-surface text-muted hover:border-primary hover:text-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={clearSearch}
              type="button"
            >
              <XIcon aria-hidden="true" size={18} weight="bold" />
            </button>
          ) : null}
          <Button className="flex-1 sm:flex-none" disabled={isPending} type="submit">
            <MagnifyingGlassIcon aria-hidden="true" size={18} weight="bold" />
            {t.dashboard.itemSearch.submit}
          </Button>
        </div>
      </form>

      <p aria-live="polite" className="sr-only" id="dashboard-item-search-status" role="status">
        {statusMessage}
      </p>

      {view === "loading" ? (
        <p className="mt-4 text-sm text-muted">{t.dashboard.itemSearch.loading}</p>
      ) : null}
      {view === "error" ? (
        <p className="mt-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">
          {t.dashboard.itemSearch.error}
        </p>
      ) : null}
      {view === "no-results" ? (
        <p className="mt-4 text-sm text-muted">{t.dashboard.itemSearch.noResults}</p>
      ) : null}
      {view === "results" && response?.kind === "success" ? (
        <ul aria-label={t.dashboard.itemSearch.results} className="mt-4 divide-y divide-line border-y border-line">
          {response.results.map((result) => (
            <li key={result.id}>
              <Link
                className="block py-3 outline-none hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                href={`${routes.items}#item-${result.id}`}
              >
                <span className="block break-words font-semibold text-foreground">
                  {result.name}
                </span>
                <span className="mt-1 block break-words text-sm leading-5 text-muted">
                  {result.location.kind === "complete" ? result.location.path : null}
                  {result.location.kind === "partial"
                    ? `${t.dashboard.itemSearch.incompleteLocation}: ${result.location.path}`
                    : null}
                  {result.location.kind === "missing"
                    ? t.dashboard.itemSearch.noLocation
                    : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
