import { updateStorageLocationL3 } from "@/app/(app)/home/actions";
import { EntityIcon } from "@/components/icons/entity-icon";
import { Badge } from "@/components/ui/badge";
import { PencilSimpleLineIcon } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { activeLocale, t } from "@/lib/i18n";
import { resolveEntityActionLabel } from "@/lib/i18n/entity-labels";
import { resolvePositionIconKey } from "@/lib/icons/home-structure-icons";
import type { StorageLocationL3 } from "./home-types";
import { CopyStorageDialog } from "./copy-storage-dialog";
import { StorageLocationL3DeleteDialog } from "./storage-location-l3-delete-dialog";
import { StorageLocationL3Form } from "./storage-location-l3-form";

type StorageLocationL3CardProps = {
  furnitureOptions: { id: string; label: string; roomId: string }[];
  isAdmin: boolean;
  locationId: string;
  position: StorageLocationL3;
  roomId: string;
  roomOptions: { id: string; label: string }[];
};

const editPositionLabel = resolveEntityActionLabel(
  activeLocale,
  "edit",
  "position",
);

const orderColumn = "kolejno\u015b\u0107" as const;

export function StorageLocationL3Card({
  furnitureOptions,
  isAdmin,
  locationId,
  position,
  roomId,
  roomOptions,
}: StorageLocationL3CardProps) {
  return (
    <li className="rounded-control border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-control bg-primary/10 text-primary">
              <EntityIcon
                group="position"
                iconKey={resolvePositionIconKey(position.ikona)}
                size={20}
              />
            </span>
            <p className="font-semibold text-foreground">{position.nazwa}</p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="primary">{position.kod_lokalizacji}</Badge>
            <Badge>
              {t.modules.home.fields.order}: {position[orderColumn]}
            </Badge>
          </div>
          {position.opis ? (
            <p className="mt-3 text-sm leading-6 text-muted">{position.opis}</p>
          ) : null}
        </div>
      </div>
      {isAdmin ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <details>
            <summary
              className={buttonClassName({
                className:
                  "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
                variant: "ghost",
              })}
            >
              <PencilSimpleLineIcon aria-hidden="true" size={18} />
              {editPositionLabel}
            </summary>
            <Card className="mt-3 p-5">
              <StorageLocationL3Form
                action={updateStorageLocationL3}
                locationId={locationId}
                position={position}
                submitLabel={t.modules.home.saveChanges}
              />
            </Card>
          </details>
          <CopyStorageDialog
            furniture={furnitureOptions}
            initialFurnitureId={locationId}
            initialRoomId={roomId}
            rooms={roomOptions}
            storageId={position.id}
            storageName={position.nazwa}
          />
          <StorageLocationL3DeleteDialog
            positionId={position.id}
            positionName={position.nazwa}
          />
        </div>
      ) : null}
    </li>
  );
}
