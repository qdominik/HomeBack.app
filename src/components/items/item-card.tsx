import {
  archiveItem,
  updateItem,
} from "@/app/(app)/items/actions";
import { activeLocale, t } from "@/lib/i18n";
import {
  getItemEditFormLocationProps,
  type ItemCategoryOption,
  type ItemLocationOption,
  type ItemLocationSelectorOptions,
} from "@/lib/items/item-options";
import type { Database } from "@/types/database";
import { ItemForm } from "./item-form";
import { ItemSubmitButton } from "./item-submit-button";

type Item = Database["public"]["Tables"]["item"]["Row"];

type ItemCardProps = {
  categories: ItemCategoryOption[];
  categoryName: string;
  isAdmin: boolean;
  item: Item;
  location: ItemLocationOption | null;
  locationOptions: ItemLocationSelectorOptions;
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

const typeLabels: Record<Database["public"]["Enums"]["item_type"], string> = {
  unikalny: t.modules.items.itemTypes.unique,
  zapas: t.modules.items.itemTypes.stock,
  zestaw: t.modules.items.itemTypes.set,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(activeLocale === "pl" ? "pl-PL" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function ItemCard({
  categories,
  categoryName,
  isAdmin,
  item,
  location,
  locationOptions,
}: ItemCardProps) {
  const locationPath = location
    ? [location.roomName, location.storageName, location.positionName].join(
        " / ",
      )
    : null;
  const showQuantity = item.typ !== "unikalny";
  const editLocationProps = getItemEditFormLocationProps(
    locationOptions,
    location,
  );

  return (
    <article className="rounded-md border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">
            {item.nazwa}
          </h2>
          <p className="mt-1 text-sm text-muted">{categoryName}</p>
        </div>
        <span className="w-fit rounded-md bg-surface-muted px-2 py-1 text-xs font-semibold text-muted">
          {statusLabels[item.status]}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 border-t border-line pt-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase text-muted">
            {t.modules.items.itemType}
          </dt>
          <dd className="mt-1 text-foreground">{typeLabels[item.typ]}</dd>
        </div>
        {showQuantity ? (
          <div>
            <dt className="text-xs font-semibold uppercase text-muted">
              {t.modules.items.quantity}
            </dt>
            <dd className="mt-1 text-foreground">{item.ilosc ?? 1}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-semibold uppercase text-muted">
            {t.modules.items.location}
          </dt>
          <dd className="mt-1 text-foreground">
            {locationPath ?? t.modules.items.noLocation}
          </dd>
        </div>
        {location?.locationCode ? (
          <div>
            <dt className="text-xs font-semibold uppercase text-muted">
              {t.modules.items.locationCode}
            </dt>
            <dd className="mt-1 font-mono text-xs text-foreground">
              {location.locationCode}
            </dd>
          </div>
        ) : null}
      </dl>
      {item.opis ? (
        <p className="mt-4 border-t border-line pt-3 text-sm leading-6 text-muted">
          {item.opis}
        </p>
      ) : null}
      <p className="mt-4 text-xs text-muted">
        {t.modules.items.addedOn}: {formatDate(item.created_at)}
      </p>
      {isAdmin ? (
        <div className="mt-4 grid gap-3 border-t border-line pt-4 lg:grid-cols-2">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-primary-strong">
              {t.modules.items.editItem}
            </summary>
            <div className="mt-3">
              <ItemForm
                action={updateItem}
                categories={categories}
                item={item}
                locationOptions={editLocationProps.locationOptions}
                selectedPositionId={editLocationProps.selectedPositionId}
                submitLabel={t.modules.items.saveChanges}
              />
            </div>
          </details>
          <form action={archiveItem}>
            <input name="item_id" type="hidden" value={item.id} />
            <ItemSubmitButton
              className="h-9 rounded-md border border-line px-3 text-sm font-semibold text-foreground hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70"
              label={t.modules.items.archiveItem}
              pendingLabel={t.modules.items.archiving}
            />
          </form>
        </div>
      ) : null}
    </article>
  );
}
