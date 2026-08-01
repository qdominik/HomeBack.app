import { createRoom } from "@/app/(app)/home/actions";
import { EmptyState } from "@/components/empty-state";
import type {
  RoomWithLocations,
  StorageLocationL2WithPositions,
} from "@/components/home/home-types";
import { EntityIcon } from "@/components/icons/entity-icon";
import { CreateRoomPanel } from "@/components/home/create-room-panel";
import { HomeSearch } from "@/components/home/home-search";
import { RoomCard } from "@/components/home/room-card";
import { Alert } from "@/components/ui/alert";
import { activeLocale, t } from "@/lib/i18n";
import {
  resolveEntityActionLabel,
  resolveEntityLabels,
} from "@/lib/i18n/entity-labels";
import {
  filterHomeStructure,
  parseHomeSearchParams,
} from "@/lib/home/home-search";
import { createClient } from "@/lib/supabase/server";

type HomeStructurePageProps = {
  searchParams: Promise<{
    error?: string;
    q?: string;
    scope?: string;
    status?: string;
  }>;
};

type CompactHomeStatProps = {
  icon: "room" | "storage" | "position";
  label: string;
  value: number;
};

const orderColumn = "kolejno\u015b\u0107" as const;
const entityLabels = resolveEntityLabels(activeLocale);
const addRoomLabel = resolveEntityActionLabel(
  activeLocale,
  "add",
  "room",
);
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
  furniture_copied: t.modules.home.statuses.locationCopied,
  location_created: t.modules.home.statuses.locationCreated,
  location_deleted: t.modules.home.statuses.locationDeleted,
  location_updated: t.modules.home.statuses.locationUpdated,
  position_created: t.modules.home.statuses.positionCreated,
  position_deleted: t.modules.home.statuses.positionDeleted,
  position_updated: t.modules.home.statuses.positionUpdated,
  room_copied: t.modules.home.statuses.roomCopied,
  room_created: t.modules.home.statuses.roomCreated,
  room_deleted: t.modules.home.statuses.roomDeleted,
  room_updated: t.modules.home.statuses.roomUpdated,
  storage_copied: t.modules.home.statuses.positionCopied,
};

function CompactHomeStat({ icon, label, value }: CompactHomeStatProps) {
  return (
    <div
      aria-label={`${value} ${label}`}
      className="flex aspect-square min-h-24 min-w-0 flex-col items-center justify-center gap-1 rounded-control border border-line bg-surface p-3 text-center shadow-card sm:h-24 sm:w-24 sm:min-h-0"
    >
      <HomeStatIcon icon={icon} />
      <strong className="text-2xl font-bold leading-none text-foreground">
        {value}
      </strong>
      <span className="max-w-full truncate text-sm font-semibold leading-5 text-muted">
        {label}
      </span>
    </div>
  );
}

function HomeStatIcon({ icon }: { icon: CompactHomeStatProps["icon"] }) {
  const iconKey =
    icon === "room" ? "room" : icon === "storage" ? "storage" : "position";

  return (
    <EntityIcon
      className="text-primary"
      group={icon}
      iconKey={iconKey}
      size={22}
      weight="regular"
    />
  );
}

export default async function HomeStructurePage({
  searchParams,
}: HomeStructurePageProps) {
  const params = await searchParams;
  const search = parseHomeSearchParams(params);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  const { data: profile } = userId
    ? await supabase
        .from("profile")
        .select("household_id, rola, status")
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
  const isAdmin = profile?.rola === "admin" && profile.status === "aktywny";
  const copyRoomOptions = rooms.map((room) => ({
    id: room.id,
    label: room.nazwa,
  }));
  const copyFurnitureOptions = (locationsData ?? []).map((location) => ({
    id: location.id,
    label: location.nazwa,
    roomId: location.room_id,
  }));
  const filteredRooms = filterHomeStructure(rooms, search) as RoomWithLocations[];
  const filteredLocationCount = filteredRooms.reduce(
    (total, room) => total + room.locations.length,
    0,
  );
  const filteredPositionCount = filteredRooms.reduce(
    (total, room) =>
      total +
      room.locations.reduce(
        (locationTotal, location) =>
          locationTotal + location.positions.length,
        0,
      ),
    0,
  );
  const roomStatValue = search.query ? filteredRooms.length : rooms.length;
  const locationStatValue = search.query ? filteredLocationCount : locationCount;
  const positionStatValue = search.query ? filteredPositionCount : positionCount;
  const errorMessage = params.error
    ? (errorMessages[params.error] ?? t.modules.home.errors.unknown)
    : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;
  const isPositionInUse = params.error === "position_in_use";
  const structureRootName = household?.nazwa.trim() || t.modules.home.structureFallback;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="border-b border-line pb-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end xl:justify-between">
          <div className="min-w-0">
            <h1 className="text-[2rem] font-bold leading-tight text-foreground sm:text-[2.5rem]">
              {structureRootName}
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted">
              {t.modules.home.subtitle}
            </p>
          </div>
          {isAdmin ? (
            <CreateRoomPanel
              action={createRoom}
              addLabel={addRoomLabel}
              submitLabel={createRoomLabel}
            >
              <section
                aria-label={structureRootName}
                className="grid grid-cols-3 gap-2 sm:gap-3"
              >
                <CompactHomeStat
                  icon="room"
                  label={entityLabels.room.plural}
                  value={roomStatValue}
                />
                <CompactHomeStat
                  icon="storage"
                  label={entityLabels.storage.plural}
                  value={locationStatValue}
                />
                <CompactHomeStat
                  icon="position"
                  label={entityLabels.position.plural}
                  value={positionStatValue}
                />
              </section>
            </CreateRoomPanel>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start xl:items-center xl:justify-end">
              <section
                aria-label={structureRootName}
                className="grid grid-cols-3 gap-2 sm:gap-3"
              >
                <CompactHomeStat
                  icon="room"
                  label={entityLabels.room.plural}
                  value={roomStatValue}
                />
                <CompactHomeStat
                  icon="storage"
                  label={entityLabels.storage.plural}
                  value={locationStatValue}
                />
                <CompactHomeStat
                  icon="position"
                  label={entityLabels.position.plural}
                  value={positionStatValue}
                />
              </section>
            </div>
          )}
        </div>
      </header>

      <HomeSearch search={search} />

      {!isAdmin ? <Alert variant="info">{t.modules.home.readOnly}</Alert> : null}
      {errorMessage ? (
        <Alert variant={isPositionInUse ? "warning" : "danger"}>
          {errorMessage}
        </Alert>
      ) : null}
      {statusMessage ? <Alert variant="success">{statusMessage}</Alert> : null}

      <section className="space-y-5">
        {filteredRooms.length ? (
          filteredRooms.map((room) => (
            <RoomCard
              furnitureOptions={copyFurnitureOptions}
              isAdmin={isAdmin}
              key={room.id}
              room={room}
              roomOptions={copyRoomOptions}
            />
          ))
        ) : search.query ? (
          <EmptyState icon={<EntityIcon group="generic" iconKey="generic" size={28} />} text={t.modules.home.search.noResults} />
        ) : (
          <EmptyState icon={<EntityIcon group="room" iconKey="room" size={28} />} text={t.modules.home.empty} />
        )}
      </section>
    </div>
  );
}
