import Link from "next/link";
import { routes } from "@/lib/routes";
import type { ItemFilters } from "@/lib/items/item-search-params";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type FilterOption = {
  id: string;
  label: string;
};

type ItemFiltersProps = {
  categories: FilterOption[];
  filters: ItemFilters;
  positions: FilterOption[];
  rooms: FilterOption[];
  storageLocations: FilterOption[];
};

const statusOptions = [
  { value: "w domu", label: t.modules.items.statuses.atHome },
  { value: "zużyte", label: t.modules.items.statuses.consumed },
  { value: "pożyczone", label: t.modules.items.statuses.borrowed },
  { value: "archiwalne", label: t.modules.items.statuses.archived },
] as const;

const sortOptions = [
  { value: "recent", label: t.modules.items.sortOptions.recent },
  { value: "name", label: t.modules.items.sortOptions.name },
  { value: "category", label: t.modules.items.sortOptions.category },
  { value: "location", label: t.modules.items.sortOptions.location },
] as const;

export function ItemFilters({
  categories,
  filters,
  positions,
  rooms,
  storageLocations,
}: ItemFiltersProps) {
  return (
    <form
      action={routes.items}
      className="grid gap-3 rounded-md border border-line bg-surface p-4 md:grid-cols-2 xl:grid-cols-4"
      method="get"
    >
      <label className="grid gap-1 text-sm font-medium text-foreground md:col-span-2">
        <span>{t.modules.items.search}</span>
        <Input
          className="text-sm font-normal"
          defaultValue={filters.query}
          name="q"
          placeholder={t.modules.items.searchPlaceholder}
          type="search"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-foreground">
        <span>{t.modules.items.category}</span>
        <Select
          className="text-sm font-normal"
          defaultValue={filters.categoryId ?? ""}
          name="category"
        >
          <option value="">{t.modules.items.allCategories}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-foreground">
        <span>{t.modules.items.status}</span>
        <Select
          className="text-sm font-normal"
          defaultValue={filters.status ?? ""}
          name="status"
        >
          <option value="">{t.modules.items.allStatuses}</option>
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-foreground">
        <span>{t.modules.items.room}</span>
        <Select
          className="text-sm font-normal"
          defaultValue={filters.roomId ?? ""}
          name="room"
        >
          <option value="">{t.modules.items.allRooms}</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.label}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-foreground">
        <span>{t.modules.items.storage}</span>
        <Select
          className="text-sm font-normal"
          defaultValue={filters.storageId ?? ""}
          name="storage"
        >
          <option value="">{t.modules.items.allStorageLocations}</option>
          {storageLocations.map((storageLocation) => (
            <option key={storageLocation.id} value={storageLocation.id}>
              {storageLocation.label}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-foreground">
        <span>{t.modules.items.position}</span>
        <Select
          className="text-sm font-normal"
          defaultValue={filters.positionId ?? ""}
          name="position"
        >
          <option value="">{t.modules.items.allPositions}</option>
          {positions.map((position) => (
            <option key={position.id} value={position.id}>
              {position.label}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-foreground">
        <span>{t.modules.items.sort}</span>
        <Select
          className="text-sm font-normal"
          defaultValue={filters.sort}
          name="sort"
        >
          {sortOptions.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </Select>
      </label>
      <div className="flex items-end gap-3">
        <button
          className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-strong"
          type="submit"
        >
          {t.modules.items.filter}
        </button>
        <Link
          className="inline-flex h-10 items-center text-sm font-semibold text-primary-strong hover:text-primary"
          href={routes.items}
        >
          {t.modules.items.clearFilters}
        </Link>
      </div>
    </form>
  );
}
