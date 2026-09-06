import Link from "next/link";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { Card } from "@/components/ui/card";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
    <Card as="section" className="p-5 sm:p-6">
      <form
        action={routes.home}
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-4"
        method="get"
      >
        <label className="ui-label min-w-0 flex-1">
          <span>{t.modules.home.search.label}</span>
          <Input
            className="mt-2"
            defaultValue={search.query}
            name="q"
            placeholder={t.modules.home.search.placeholder}
            type="search"
          />
        </label>
        <label className="ui-label lg:w-56 lg:shrink-0">
          <span>{t.modules.home.search.scope}</span>
          <Select
            className="mt-2"
            defaultValue={search.scope}
            name="scope"
          >
            {scopes.map((scope) => (
              <option key={scope.value} value={scope.value}>
                {scope.label}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
          <Button className="w-full sm:w-auto" type="submit">
            <MagnifyingGlassIcon aria-hidden="true" size={18} />
            {t.modules.home.search.submit}
          </Button>
          <Link
            className={buttonClassName({
              className: "w-full sm:w-auto",
              variant: "ghost",
            })}
            href={routes.home}
          >
            {t.modules.home.search.clear}
          </Link>
        </div>
      </form>
    </Card>
  );
}
