import {
  createStorageLocationL3,
  deleteStorageLocationL2,
  updateStorageLocationL2,
} from "@/app/(app)/home/actions";
import { EmptyState } from "@/components/empty-state";
import { activeLocale, t } from "@/lib/i18n";
import {
  resolveEntityActionLabel,
  resolveEntityLabels,
} from "@/lib/i18n/entity-labels";
import type { StorageLocationL2WithPositions } from "./home-types";
import { StorageLocationL2Form } from "./storage-location-l2-form";
import { StorageLocationL3Card } from "./storage-location-l3-card";
import { StorageLocationL3Form } from "./storage-location-l3-form";

type StorageLocationL2CardProps = {
  isAdmin: boolean;
  location: StorageLocationL2WithPositions;
  roomId: string;
};

const entityLabels = resolveEntityLabels(activeLocale);
const editStorageLabel = resolveEntityActionLabel(
  activeLocale,
  "edit",
  "storage",
);
const addPositionLabel = resolveEntityActionLabel(
  activeLocale,
  "add",
  "position",
);
const createPositionLabel = resolveEntityActionLabel(
  activeLocale,
  "create",
  "position",
);
const deleteStorageLabel = resolveEntityActionLabel(
  activeLocale,
  "delete",
  "storage",
);

export function StorageLocationL2Card({
  isAdmin,
  location,
  roomId,
}: StorageLocationL2CardProps) {
  const canDelete = location.positions.length === 0;

  return (
    <div className="border-t border-line py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{location.nazwa}</h3>
            <span className="rounded-md bg-surface-muted px-2 py-1 text-xs font-semibold text-muted">
              {location.typ}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {entityLabels.position.plural}: {location.positions.length}
          </p>
          {location.opis ? (
            <p className="mt-2 text-sm leading-6 text-muted">{location.opis}</p>
          ) : null}
        </div>
        <p className="shrink-0 text-xs text-muted">
          {t.modules.home.fields.order}: {location.kolejność}
        </p>
      </div>
      {isAdmin ? (
        <div className="mt-3 grid gap-3 border-t border-line pt-3 lg:grid-cols-2">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-primary-strong">
              {editStorageLabel}
            </summary>
            <div className="mt-3">
              <StorageLocationL2Form
                action={updateStorageLocationL2}
                location={location}
                roomId={roomId}
                submitLabel={t.modules.home.saveChanges}
              />
            </div>
          </details>
          <div className="flex flex-col gap-3">
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-primary-strong">
                {addPositionLabel}
              </summary>
              <div className="mt-3">
                <StorageLocationL3Form
                  action={createStorageLocationL3}
                  locationId={location.id}
                  submitLabel={createPositionLabel}
                />
              </div>
            </details>
            <form action={deleteStorageLocationL2}>
              <input name="location_l2_id" type="hidden" value={location.id} />
              <button
                className="h-9 rounded-md border border-line px-3 text-sm font-semibold text-foreground hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canDelete}
                type="submit"
              >
                {deleteStorageLabel}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <div className="mt-4">
        {location.positions.length ? (
          <ul>
            {location.positions.map((position) => (
              <StorageLocationL3Card
                isAdmin={isAdmin}
                key={position.id}
                locationId={location.id}
                position={position}
              />
            ))}
          </ul>
        ) : (
          <EmptyState text={t.modules.home.noPositions} />
        )}
      </div>
    </div>
  );
}
