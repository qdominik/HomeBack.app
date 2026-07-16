import {
  archiveItem,
  deleteItemPermanently,
  updateItem,
} from "@/app/(app)/items/actions";
import { EntityIcon } from "@/components/icons/entity-icon";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { PencilSimpleLineIcon } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { buttonClassName } from "@/components/ui/button";
import { activeLocale, t } from "@/lib/i18n";
import { formatDeleteConfirmation } from "@/lib/confirm-delete";
import { resolveItemIconKey } from "@/lib/icons/item-icon-resolution";
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
  categoryKey: string | null;
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
  "zu\u017cyte": t.modules.items.statuses.consumed,
  "po\u017cyczone": t.modules.items.statuses.borrowed,
  archiwalne: t.modules.items.statuses.archived,
};

const typeLabels: Record<Database["public"]["Enums"]["item_type"], string> = {
  unikalny: t.modules.items.itemTypes.unique,
  zapas: t.modules.items.itemTypes.stock,
  zestaw: t.modules.items.itemTypes.set,
};

function getStatusTone(status: Database["public"]["Enums"]["item_status"]) {
  if (status === "w domu") {
    return "success";
  }

  if (status === "archiwalne") {
    return "neutral";
  }

  if (status === "po\u017cyczone") {
    return "warning";
  }

  return "info";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(activeLocale === "pl" ? "pl-PL" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function ItemCard({
  categories,
  categoryKey,
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
  const isArchived = item.status === "archiwalne";
  const itemIconKey = resolveItemIconKey({ categoryKey });
  const metaItems = [categoryName, typeLabels[item.typ]];

  if (showQuantity) {
    metaItems.push(`${t.modules.items.quantity}: ${item.ilosc ?? 1}`);
  }

  const editLocationProps = getItemEditFormLocationProps(
    locationOptions,
    location,
  );

  return (
    <article className="rounded-md border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary">
            <EntityIcon
              group="item"
              iconKey={itemIconKey}
              size={22}
              weight="duotone"
            />
          </span>
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold leading-snug text-foreground">
              {item.nazwa}
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted">
              {metaItems.join(" \u00b7 ")}
            </p>
          </div>
        </div>
        <Badge tone={getStatusTone(item.status)}>
          {statusLabels[item.status]}
        </Badge>
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <p className="break-words text-sm leading-6 text-foreground">
          {locationPath ?? t.modules.items.noLocation}
        </p>
        {location?.locationCode ? (
          <p className="mt-1 font-mono text-xs leading-5 text-muted">
            {location.locationCode}
          </p>
        ) : null}
      </div>

      {item.opis ? (
        <p className="mt-3 break-words text-sm leading-6 text-muted">
          {item.opis}
        </p>
      ) : null}

      <div className="mt-4 border-t border-line pt-3">
        <div
          className={`grid gap-3 sm:items-center ${
            isArchived
              ? "sm:grid-cols-[1fr_auto]"
              : "sm:grid-cols-[1fr_auto_auto_auto]"
          }`}
        >
          <p className="text-xs leading-5 text-muted">
            {t.modules.items.addedOn}: {formatDate(item.created_at)}
          </p>
          {isAdmin && !isArchived ? (
            <details className="sm:contents">
              <summary
                className={buttonClassName({
                  className:
                    "w-full cursor-pointer list-none sm:w-auto [&::-webkit-details-marker]:hidden",
                  variant: "secondary",
                })}
              >
                <PencilSimpleLineIcon
                  aria-hidden="true"
                  className="mr-2"
                  size={18}
                  weight="bold"
                />
                {t.modules.items.editItem}
              </summary>
              <div className="mt-3 sm:col-span-4 sm:row-start-2">
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
          ) : null}
          {isAdmin && !isArchived ? (
            <form action={archiveItem} className="sm:col-start-3 sm:row-start-1">
              <input name="item_id" type="hidden" value={item.id} />
              <ItemSubmitButton
                className={buttonClassName({
                  className: "w-full sm:w-auto",
                  variant: "secondary",
                })}
                icon="archive"
                label={t.modules.items.archiveItem}
                pendingLabel={t.modules.items.archiving}
              />
            </form>
          ) : null}
          {isAdmin ? (
            <form
              action={deleteItemPermanently}
              className={isArchived ? "sm:col-start-2" : "sm:col-start-4"}
            >
              <input name="item_id" type="hidden" value={item.id} />
              <ConfirmDeleteButton
                className={buttonClassName({
                  className: "w-full gap-2 sm:w-auto",
                  variant: "danger",
                })}
                confirmationMessage={formatDeleteConfirmation(
                  t.modules.items.confirmations.deleteItem,
                  item.nazwa,
                )}
              >
                <TrashIcon aria-hidden="true" size={18} weight="bold" />
                {t.modules.items.deleteItem}
              </ConfirmDeleteButton>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );
}
