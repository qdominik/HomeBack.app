import Link from "next/link";
import { t } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import type { HomeSearch } from "@/lib/home/home-search";

type HomeSearchProps = {
  search: HomeSearch;
};

const scopes = [
  { value: "all", label: t.modules.home.search.scopes.all },
  { value: "rooms", label: t.modules.home.search.scopes.rooms },
  { value: "storage", label: t.modules.home.search.scopes.storage },
  { value: "positions", label: t.modules.home.search.scopes.positions },
] as const;

export function HomeSearch({ search }: HomeSearchProps) {
  return (
    <form
      action={routes.home}
      className="mt-4 flex flex-col gap-3 rounded-md border border-line bg-surface p-3 sm:flex-row sm:items-end"
      method="get"
    >
      <label className="grid min-w-0 flex-1 gap-1 text-sm font-medium text-foreground">
        <span>{t.modules.home.search.label}</span>
        <input
          className="h-10 rounded-md border border-line bg-white px-3 text-sm font-normal outline-none focus:border-primary"
          defaultValue={search.query}
          name="q"
          placeholder={t.modules.home.search.placeholder}
          type="search"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-foreground sm:w-48">
        <span>{t.modules.home.search.scope}</span>
        <select
          className="h-10 rounded-md border border-line bg-white px-3 text-sm font-normal outline-none focus:border-primary"
          defaultValue={search.scope}
          name="scope"
        >
          {scopes.map((scope) => (
            <option key={scope.value} value={scope.value}>
              {scope.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-3">
        <button
          className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-strong"
          type="submit"
        >
          {t.modules.home.search.submit}
        </button>
        <Link
          className="inline-flex h-10 items-center text-sm font-semibold text-primary-strong hover:text-primary"
          href={routes.home}
        >
          {t.modules.home.search.clear}
        </Link>
      </div>
    </form>
  );
}
