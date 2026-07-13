import {
  deleteStorageLocationL3,
  updateStorageLocationL3,
} from "@/app/(app)/home/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <li className="rounded-control border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{position.nazwa}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="primary">{position.kod_lokalizacji}</Badge>
            <Badge>
              {t.modules.home.fields.order}: {position.kolejność}
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
          <form action={deleteStorageLocationL3}>
            <input name="location_l3_id" type="hidden" value={position.id} />
            <Button type="submit" variant="danger">
              {deletePositionLabel}
            </Button>
          </form>
        </div>
      ) : null}
    </li>
  );
}