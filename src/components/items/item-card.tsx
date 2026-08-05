import {
  archiveItem,
  restoreItem,
  updateItem,
} from "@/app/(app)/items/actions";
import { Badge } from "@/components/ui/badge";
import { PencilSimpleLineIcon } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { buttonClassName } from "@/components/ui/button";
import { activeLocale, t } from "@/lib/i18n";
import { resolveItemIconKey } from "@/lib/icons/item-icon-resolution";
import { getArchivedItemRestoreMode } from "@/lib/items/item-archive-restore";
import {
  getItemEditFormLocationProps,
  type ItemCategoryOption,
  type ItemLocationOption,
  type ItemLocationSelectorOptions,
} from "@/lib/items/item-options";
import type { Database } from "@/types/database";
import { ItemForm } from "./item-form";
import { ItemPhotoThumbnail } from "./item-photo-thumbnail";
import { ItemSubmitButton } from "./item-submit-button";
import { LegacyItemRestoreForm } from "./legacy-item-restore-form";
import { CopyItemDialog } from "./copy-item-dialog";
import { ItemPermanentDeleteDialog } from "./item-permanent-delete-dialog";

type Item = Database["public"]["Tables"]["item"]["Row"];

type ItemPhotoForForm = {
  filename: string;
  mimeType: string;
  previewUrl: string | null;
  sizeBytes: number;
  storagePath: string;
};

type ItemCardProps = {
  canCopy: boolean;
  categories: ItemCategoryOption[];
  categoryKey: string | null;
  categoryName: string;
  hasAttachedFiles: boolean;
  isAdmin: boolean;
  item: Item;
  location: ItemLocationOption | null;
  locationOptions: ItemLocationSelectorOptions;
  photo: ItemPhotoForForm | null;
  photoPreviewUrl: string | null;
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
  canCopy,
  categories,
  categoryKey,
  categoryName,
  hasAttachedFiles,
  isAdmin,
  item,
  location,
  locationOptions,
  photo,
  photoPreviewUrl,
}: ItemCardProps) {
  const locationPath = location
    ? [location.roomName, location.storageName, location.positionName].join(
        " / ",
      )
    : null;
  const showQuantity = item.typ !== "unikalny";
  const isArchived = item.status === "archiwalne";
  const restoreMode = getArchivedItemRestoreMode(item.status_before_archive);
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
          <ItemPhotoThumbnail
            alt={item.nazwa}
            iconKey={itemIconKey}
            previewUrl={photoPreviewUrl}
          />
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
          className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"

        >
          <p className="text-xs leading-5 text-muted">
            {t.modules.items.addedOn}: {formatDate(item.created_at)}
          </p>
          {canCopy ? (
            <CopyItemDialog
              itemId={item.id}
              itemName={item.nazwa}
              location={location}
              locationOptions={locationOptions}
            />
          ) : null}
          {isAdmin && !isArchived ? (
            <form action={archiveItem}>
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
          {isAdmin && isArchived ? (
            restoreMode === "legacy" ? (
              <LegacyItemRestoreForm itemId={item.id} />
            ) : (
              <form action={restoreItem}>
                <input name="item_id" type="hidden" value={item.id} />
                <ItemSubmitButton
                  className={buttonClassName({
                    className: "w-full sm:w-auto",
                    variant: "secondary",
                  })}
                  icon="restore"
                  label={t.modules.items.restoreItem}
                  pendingLabel={t.modules.items.restoring}
                />
              </form>
            )
          ) : null}
          {isAdmin ? (
            <ItemPermanentDeleteDialog
              hasAttachedFiles={hasAttachedFiles}
              itemId={item.id}
              itemName={item.nazwa}
            />
          ) : null}
        </div>
        {isAdmin && !isArchived ? (
          <details className="mt-3">
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
            <div className="mt-3 rounded-md border border-line bg-surface-muted p-3 sm:p-4">
              <ItemForm
                action={updateItem}
                categories={categories}
                item={item}
                layout="compact"
                locationOptions={editLocationProps.locationOptions}
                photo={photo}
                selectedPositionId={editLocationProps.selectedPositionId}
                submitLabel={t.modules.items.saveChanges}
              />
            </div>
          </details>
        ) : null}
      </div>
    </article>
  );
}
