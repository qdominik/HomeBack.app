import {
  copyFurniture,
  createStorageLocationL3,
  updateStorageLocationL2,
} from "@/app/(app)/home/actions";
import { EmptyState } from "@/components/empty-state";
import { EntityIcon } from "@/components/icons/entity-icon";
import { PencilSimpleLineIcon } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyEntityDialog } from "@/components/copy-entity-dialog";
import { activeLocale, t } from "@/lib/i18n";
import { resolveStorageLocationIconKey } from "@/lib/icons/home-structure-icons";
import {
  resolveEntityActionLabel,
  resolveEntityLabels,
} from "@/lib/i18n/entity-labels";
import type { StorageLocationL2WithPositions } from "./home-types";
import { StorageLocationL2DeleteDialog } from "./storage-location-l2-delete-dialog";
import { StorageLocationL2Form } from "./storage-location-l2-form";
import { StorageLocationL3Card } from "./storage-location-l3-card";
import { StorageLocationL3Form } from "./storage-location-l3-form";

type StorageLocationL2CardProps = {
  isAdmin: boolean;
  location: StorageLocationL2WithPositions;
  roomId: string;
  roomOptions?: { id: string; label: string }[];
  storageOptions?: { id: string; label: string }[];
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
const orderColumn = "kolejno\u015b\u0107" as const;

export function StorageLocationL2Card({
  isAdmin,
  location,
  roomId,
  roomOptions = [],
  storageOptions = [],
}: StorageLocationL2CardProps) {
  const iconKey = resolveStorageLocationIconKey(location.typ);

  return (
    <section className="rounded-control border border-line bg-surface-muted p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-control bg-surface text-primary">
              <EntityIcon
                group="storage"
                iconKey={iconKey}
                size={20}
                weight="regular"
              />
            </span>
            <h3 className="text-lg font-semibold leading-7 text-foreground">
              {location.nazwa}
            </h3>
            <Badge>{location.typ}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            {entityLabels.position.plural}: {location.positions.length}
          </p>
          {location.opis ? (
            <p className="mt-3 text-sm leading-6 text-muted">{location.opis}</p>
          ) : null}
        </div>
        <Badge>
          {t.modules.home.fields.order}: {location[orderColumn]}
        </Badge>
      </div>

      {isAdmin ? (
        <div className="mt-5 grid gap-3 border-t border-line pt-5 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <details>
              <summary
                className={buttonClassName({
                  className:
                    "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
                  variant: "ghost",
                })}
              >
                <PencilSimpleLineIcon aria-hidden="true" size={18} />
                {editStorageLabel}
              </summary>
              <Card className="mt-3 p-5">
                <StorageLocationL2Form
                  action={updateStorageLocationL2}
                  location={location}
                  roomId={roomId}
                  submitLabel={t.modules.home.saveChanges}
                />
              </Card>
            </details>
            <details>
              <summary
                className={buttonClassName({
                  className:
                    "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
                  variant: "secondary",
                })}
              >
                <PlusIcon aria-hidden="true" size={18} weight="bold" />
                {addPositionLabel}
              </summary>
              <Card className="mt-3 p-5">
                <StorageLocationL3Form
                  action={createStorageLocationL3}
                  locationId={location.id}
                  submitLabel={createPositionLabel}
                />
              </Card>
            </details>
          </div>
          <StorageLocationL2DeleteDialog
            storageLocationL2Id={location.id}
            storageLocationL2Name={location.nazwa}
          />
          <CopyEntityDialog action={copyFurniture} kind="furniture" sourceId={location.id} sourceName={location.nazwa} targetId={roomId} targetOptions={roomOptions} targetLabel="Pomieszczenie" structureCount={location.positions.length} />
        </div>
      ) : null}

      {location.positions.length ? (
        <ul className="mt-5 space-y-2 border-t border-line pt-4">
          {location.positions.map((position) => (
            <StorageLocationL3Card
              isAdmin={isAdmin}
              key={position.id}
              locationId={location.id}
              position={position}
              storageOptions={storageOptions}
            />
          ))}
        </ul>
      ) : (
        <div className="mt-5">
          <EmptyState text={t.modules.home.noPositions} />
        </div>
      )}
    </section>
  );
}
