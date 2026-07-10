import {
  deleteStorageLocationL3,
  updateStorageLocationL3,
} from "@/app/(app)/home/actions";
import { activeLocale, t } from "@/lib/i18n";
import { resolveEntityActionLabel } from "@/lib/i18n/entity-labels";
import type { StorageLocationL3 } from "./home-types";
import { StorageLocationL3Form } from "./storage-location-l3-form";

type StorageLocationL3CardProps = {
  isAdmin: boolean;
  locationId: string;
  position: StorageLocationL3;
};

const editPositionLabel = resolveEntityActionLabel(
  activeLocale,
  "edit",
  "position",
);
const deletePositionLabel = resolveEntityActionLabel(
  activeLocale,
  "delete",
  "position",
);

export function StorageLocationL3Card({
  isAdmin,
  locationId,
  position,
}: StorageLocationL3CardProps) {
  return (
    <li className="border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{position.nazwa}</p>
          <p className="mt-1 inline-flex rounded-md bg-surface-muted px-2 py-1 text-xs font-semibold text-primary-strong">
            {position.kod_lokalizacji}
          </p>
          {position.opis ? (
            <p className="mt-2 text-sm leading-6 text-muted">{position.opis}</p>
          ) : null}
        </div>
        <p className="shrink-0 text-xs text-muted">
          {t.modules.home.fields.order}: {position.kolejność}
        </p>
      </div>
      {isAdmin ? (
        <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-primary-strong">
              {editPositionLabel}
            </summary>
            <div className="mt-3">
              <StorageLocationL3Form
                action={updateStorageLocationL3}
                locationId={locationId}
                position={position}
                submitLabel={t.modules.home.saveChanges}
              />
            </div>
          </details>
          <form action={deleteStorageLocationL3}>
            <input name="location_l3_id" type="hidden" value={position.id} />
            <button
              className="h-9 rounded-md border border-line px-3 text-sm font-semibold text-foreground hover:bg-surface-muted"
              type="submit"
            >
              {deletePositionLabel}
            </button>
          </form>
        </div>
      ) : null}
    </li>
  );
}
