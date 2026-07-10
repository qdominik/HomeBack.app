import { createRoom } from "@/app/(app)/home/actions";
import { EmptyState } from "@/components/empty-state";
import type {
  RoomWithLocations,
  StorageLocationL2WithPositions,
} from "@/components/home/home-types";
import { RoomCard } from "@/components/home/room-card";
import { RoomForm } from "@/components/home/room-form";
import { ModulePage } from "@/components/module-page";
import { activeLocale, t } from "@/lib/i18n";
import {
  resolveEntityActionLabel,
  resolveEntityLabels,
} from "@/lib/i18n/entity-labels";
import { createClient } from "@/lib/supabase/server";

type HomeStructurePageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

const orderColumn = "kolejność" as const;
const entityLabels = resolveEntityLabels(activeLocale);
const addRoomLabel = resolveEntityActionLabel(activeLocale, "add", "room");
const createRoomLabel = resolveEntityActionLabel(
  activeLocale,
  "create",
  "room",
);

const errorMessages: Record<string, string> = {
  action_failed: t.modules.home.errors.actionFailed,
  admin_required: t.modules.home.errors.adminRequired,
  duplicate_location: t.modules.home.errors.duplicateLocation,
  duplicate_position: t.modules.home.errors.duplicatePosition,
  duplicate_room: t.modules.home.errors.duplicateRoom,
  invalid_order: t.modules.home.errors.invalidOrder,
  location_not_empty: t.modules.home.errors.locationNotEmpty,
  missing_fields: t.modules.home.errors.missingFields,
  position_in_use: t.modules.home.errors.positionInUse,
  room_not_empty: t.modules.home.errors.roomNotEmpty,
};

const statusMessages: Record<string, string> = {
  location_created: t.modules.home.statuses.locationCreated,
  location_deleted: t.modules.home.statuses.locationDeleted,
  location_updated: t.modules.home.statuses.locationUpdated,
  position_created: t.modules.home.statuses.positionCreated,
  position_deleted: t.modules.home.statuses.positionDeleted,
  position_updated: t.modules.home.statuses.positionUpdated,
  room_created: t.modules.home.statuses.roomCreated,
  room_deleted: t.modules.home.statuses.roomDeleted,
  room_updated: t.modules.home.statuses.roomUpdated,
};

export default async function HomeStructurePage({
  searchParams,
}: HomeStructurePageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  const { data: profile } = userId
    ? await supabase
        .from("profile")
        .select("household_id, rola")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };

  const { data: household } = profile
    ? await supabase
        .from("household")
        .select("nazwa")
        .eq("id", profile.household_id)
        .maybeSingle()
    : { data: null };

  const { data: roomsData } = await supabase
    .from("room")
    .select("*")
    .order(orderColumn, { ascending: true })
    .order("created_at", { ascending: true });

  const roomIds = roomsData?.map((room) => room.id) ?? [];
  const { data: locationsData } = roomIds.length
    ? await supabase
        .from("storage_location_l2")
        .select("*")
        .in("room_id", roomIds)
        .order(orderColumn, { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [] };

  const locationIds = locationsData?.map((location) => location.id) ?? [];
  const { data: positionsData } = locationIds.length
    ? await supabase
        .from("storage_location_l3")
        .select("*")
        .in("storage_location_l2_id", locationIds)
        .order(orderColumn, { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [] };

  const positionsByLocation = new Map<string, typeof positionsData>();

  for (const position of positionsData ?? []) {
    const current = positionsByLocation.get(position.storage_location_l2_id) ?? [];
    current.push(position);
    positionsByLocation.set(position.storage_location_l2_id, current);
  }

  const locationsByRoom = new Map<string, StorageLocationL2WithPositions[]>();

  for (const location of locationsData ?? []) {
    const current = locationsByRoom.get(location.room_id) ?? [];
    current.push({
      ...location,
      positions: positionsByLocation.get(location.id) ?? [],
    });
    locationsByRoom.set(location.room_id, current);
  }

  const rooms: RoomWithLocations[] = (roomsData ?? []).map((room) => ({
    ...room,
    locations: locationsByRoom.get(room.id) ?? [],
  }));
  const locationCount = rooms.reduce(
    (total, room) => total + room.locations.length,
    0,
  );
  const positionCount = rooms.reduce(
    (total, room) =>
      total +
      room.locations.reduce(
        (locationTotal, location) =>
          locationTotal + location.positions.length,
        0,
      ),
    0,
  );
  const isAdmin = profile?.rola === "admin";
  const errorMessage = params.error
    ? (errorMessages[params.error] ?? t.modules.home.errors.unknown)
    : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;

  return (
    <ModulePage
      action={
        isAdmin ? (
          <details className="w-full rounded-md border border-line bg-surface p-3 sm:w-auto sm:min-w-80">
            <summary className="cursor-pointer text-sm font-semibold text-primary-strong">
              {addRoomLabel}
            </summary>
            <div className="mt-4">
              <RoomForm
                action={createRoom}
                submitLabel={createRoomLabel}
              />
            </div>
          </details>
        ) : null
      }
      title={t.modules.home.title}
    >
      <section className="border-b border-line pb-5">
        <p className="text-sm text-muted">{t.modules.home.subtitle}</p>
        <p className="mt-2 text-sm font-medium text-foreground">
          {t.modules.home.household}: {household?.nazwa ?? ""}
        </p>
        {!isAdmin ? (
          <p className="mt-3 rounded-md border border-line bg-surface px-3 py-2 text-sm text-muted">
            {t.modules.home.readOnly}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-3 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {errorMessage}
          </p>
        ) : null}
        {statusMessage ? (
          <p className="mt-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary-strong">
            {statusMessage}
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-line bg-surface p-4">
          <p className="text-sm text-muted">{entityLabels.room.plural}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {rooms.length}
          </p>
        </div>
        <div className="rounded-md border border-line bg-surface p-4">
          <p className="text-sm text-muted">{entityLabels.storage.plural}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {locationCount}
          </p>
        </div>
        <div className="rounded-md border border-line bg-surface p-4">
          <p className="text-sm text-muted">{entityLabels.position.plural}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {positionCount}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        {rooms.length ? (
          rooms.map((room) => (
            <RoomCard isAdmin={isAdmin} key={room.id} room={room} />
          ))
        ) : (
          <EmptyState text={t.modules.home.empty} />
        )}
      </section>
    </ModulePage>
  );
}
