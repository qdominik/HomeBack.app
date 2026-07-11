import { activeLocale, t } from "@/lib/i18n";
import type { Database } from "@/types/database";

type ItemCardProps = {
  categoryName: string;
  createdAt: string;
  location: string | null;
  locationCode: string | null;
  name: string;
  status: Database["public"]["Enums"]["item_status"];
};

const statusLabels: Record<
  Database["public"]["Enums"]["item_status"],
  string
> = {
  "w domu": t.modules.items.statuses.atHome,
  zużyte: t.modules.items.statuses.consumed,
  pożyczone: t.modules.items.statuses.borrowed,
  archiwalne: t.modules.items.statuses.archived,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(activeLocale === "pl" ? "pl-PL" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function ItemCard({
  categoryName,
  createdAt,
  location,
  locationCode,
  name,
  status,
}: ItemCardProps) {
  return (
    <article className="rounded-md border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{name}</h2>
          <p className="mt-1 text-sm text-muted">{categoryName}</p>
        </div>
        <span className="w-fit rounded-md bg-surface-muted px-2 py-1 text-xs font-semibold text-muted">
          {statusLabels[status]}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 border-t border-line pt-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase text-muted">
            {t.modules.items.location}
          </dt>
          <dd className="mt-1 text-foreground">
            {location ?? t.modules.items.noLocation}
          </dd>
        </div>
        {locationCode ? (
          <div>
            <dt className="text-xs font-semibold uppercase text-muted">
              {t.modules.items.locationCode}
            </dt>
            <dd className="mt-1 font-mono text-xs text-foreground">
              {locationCode}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 text-xs text-muted">
        {t.modules.items.addedOn}: {formatDate(createdAt)}
      </p>
    </article>
  );
}
