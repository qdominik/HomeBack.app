import {
  copyRoom,
  createStorageLocationL2,
  updateRoom,
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
import {
  resolveEntityActionLabel,
  resolveEntityLabels,
} from "@/lib/i18n/entity-labels";
import type { RoomWithLocations } from "./home-types";
import { RoomDeleteDialog } from "./room-delete-dialog";
import { RoomForm } from "./room-form";
import { StorageLocationL2Card } from "./storage-location-l2-card";
import { StorageLocationL2Form } from "./storage-location-l2-form";

type RoomCardProps = {
  isAdmin: boolean;
  room: RoomWithLocations;
  roomOptions?: { id: string; label: string }[];
  storageOptions?: { id: string; label: string }[];
};

const entityLabels = resolveEntityLabels(activeLocale);
const editRoomLabel = resolveEntityActionLabel(activeLocale, "edit", "room");
const addStorageLabel = resolveEntityActionLabel(
  activeLocale,
  "add",
  "storage",
);
const createStorageLabel = resolveEntityActionLabel(
  activeLocale,
  "create",
  "storage",
);

const orderColumn = "kolejno\u015b\u0107" as const;

export function RoomCard({ isAdmin, room, roomOptions = [], storageOptions = [] }: RoomCardProps) {
  const positionCount = room.locations.reduce(
    (total, location) => total + location.positions.length,
    0,
  );

  return (
    <Card as="article" className="p-5 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-control bg-primary/10 text-primary">
              <EntityIcon
                group="room"
                iconKey={room.ikona}
                size={22}
                weight="duotone"
              />
            </span>
            <h2 className="text-xl font-semibold leading-7 text-foreground">
              {room.nazwa}
            </h2>
            <Badge tone="primary">{room.typ}</Badge>
          </div>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
            <div>
              <dt className="sr-only">{entityLabels.storage.plural}</dt>
              <dd>
                {entityLabels.storage.plural}: {room.locations.length}
              </dd>
            </div>
            <div>
              <dt className="sr-only">{entityLabels.position.plural}</dt>
              <dd>
                {entityLabels.position.plural}: {positionCount}
              </dd>
            </div>
          </dl>
          {room.opis ? (
            <p className="mt-3 text-sm leading-6 text-muted">{room.opis}</p>
          ) : null}
        </div>
        <Badge>
          {t.modules.home.fields.order}: {room[orderColumn]}
        </Badge>
      </header>

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
                {editRoomLabel}
              </summary>
              <Card className="mt-3 p-5">
                <RoomForm
                  action={updateRoom}
                  room={room}
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
                {addStorageLabel}
              </summary>
              <Card className="mt-3 p-5">
                <StorageLocationL2Form
                  action={createStorageLocationL2}
                  roomId={room.id}
                  submitLabel={createStorageLabel}
                />
              </Card>
            </details>
          </div>
          <RoomDeleteDialog roomId={room.id} roomName={room.nazwa} />
          <CopyEntityDialog action={copyRoom} kind="room" sourceId={room.id} sourceName={room.nazwa} structureCount={positionCount + room.locations.length} />
        </div>
      ) : null}

      <section className="mt-6 border-t border-line pt-5">
        <h3 className="text-lg font-semibold leading-7 text-foreground">
          {entityLabels.storage.plural}
        </h3>
        {room.locations.length ? (
          <div className="mt-4 space-y-3">
            {room.locations.map((location) => (
              <StorageLocationL2Card
                isAdmin={isAdmin}
                key={location.id}
                location={location}
                roomId={room.id}
                roomOptions={roomOptions}
                storageOptions={storageOptions}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState text={t.modules.home.noLocations} />
          </div>
        )}
      </section>
    </Card>
  );
}
