import {
  createStorageLocationL2,
  deleteRoom,
  updateRoom,
} from "@/app/(app)/home/actions";
import { EmptyState } from "@/components/empty-state";
import { activeLocale, t } from "@/lib/i18n";
import {
  resolveEntityActionLabel,
  resolveEntityLabels,
} from "@/lib/i18n/entity-labels";
import type { RoomWithLocations } from "./home-types";
import { RoomForm } from "./room-form";
import { StorageLocationL2Card } from "./storage-location-l2-card";
import { StorageLocationL2Form } from "./storage-location-l2-form";

type RoomCardProps = {
  isAdmin: boolean;
  room: RoomWithLocations;
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
const deleteRoomLabel = resolveEntityActionLabel(
  activeLocale,
  "delete",
  "room",
);

export function RoomCard({ isAdmin, room }: RoomCardProps) {
  const positionCount = room.locations.reduce(
    (total, location) => total + location.positions.length,
    0,
  );
  const canDelete = room.locations.length === 0;

  return (
    <article className="rounded-md border border-line bg-surface p-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {room.ikona ? (
              <span aria-hidden="true" className="text-xl">
                {room.ikona}
              </span>
            ) : null}
            <h2 className="text-lg font-semibold text-foreground">
              {room.nazwa}
            </h2>
            <span className="rounded-md bg-surface-muted px-2 py-1 text-xs font-semibold text-muted">
              {room.typ}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {entityLabels.storage.plural}: {room.locations.length} ·{" "}
            {entityLabels.position.plural}: {positionCount}
          </p>
          {room.opis ? (
            <p className="mt-2 text-sm leading-6 text-muted">{room.opis}</p>
          ) : null}
        </div>
        <p className="shrink-0 text-xs text-muted">
          {t.modules.home.fields.order}: {room.kolejność}
        </p>
      </header>
      {isAdmin ? (
        <div className="mt-4 grid gap-3 border-t border-line pt-4 lg:grid-cols-2">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-primary-strong">
              {editRoomLabel}
            </summary>
            <div className="mt-3">
              <RoomForm
                action={updateRoom}
                room={room}
                submitLabel={t.modules.home.saveChanges}
              />
            </div>
          </details>
          <div className="flex flex-col gap-3">
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-primary-strong">
                {addStorageLabel}
              </summary>
              <div className="mt-3">
                <StorageLocationL2Form
                  action={createStorageLocationL2}
                  roomId={room.id}
                  submitLabel={createStorageLabel}
                />
              </div>
            </details>
            <form action={deleteRoom}>
              <input name="room_id" type="hidden" value={room.id} />
              <button
                className="h-9 rounded-md border border-line px-3 text-sm font-semibold text-foreground hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canDelete}
                type="submit"
              >
                {deleteRoomLabel}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <section className="mt-5 border-t border-line pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase text-muted">
            {entityLabels.storage.plural}
          </h3>
        </div>
        {room.locations.length ? (
          <div>
            {room.locations.map((location) => (
              <StorageLocationL2Card
                isAdmin={isAdmin}
                key={location.id}
                location={location}
                roomId={room.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState text={t.modules.home.noLocations} />
        )}
      </section>
    </article>
  );
}
