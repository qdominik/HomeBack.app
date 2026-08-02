import Link from "next/link";
import { ArchiveIcon } from "@phosphor-icons/react/dist/ssr/Archive";
import { ListBulletsIcon } from "@phosphor-icons/react/dist/ssr/ListBullets";
import { MapPinLineIcon } from "@phosphor-icons/react/dist/ssr/MapPinLine";
import { PackageIcon } from "@phosphor-icons/react/dist/ssr/Package";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { createItem } from "@/app/(app)/items/actions";
import { ItemCard } from "@/components/items/item-card";
import { ItemForm } from "@/components/items/item-form";
import { EmptyState } from "@/components/empty-state";
import {
  getDefaultItemCategoryId,
  getItemCategoryOptions,
} from "@/lib/categories/category-selection";
import { t } from "@/lib/i18n";
import {
  buildItemLocationSelectorOptions,
  type ItemCategoryOption,
} from "@/lib/items/item-options";
import {
  filterItemsForView,
  parseItemView,
  type ItemView,
} from "@/lib/items/item-view-filter";
import { getAppContext } from "@/lib/app-context";

type ItemsPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
    view?: string | string[];
  }>;
};

const orderColumn = "kolejno\u015b\u0107" as const;

const errorMessages: Record<string, string> = {
  action_failed: t.modules.items.errors.actionFailed,
  active_profile_required: t.modules.items.errors.activeProfileRequired,
  admin_required: t.modules.items.errors.adminRequired,
  deletion_failed: t.modules.items.errors.deletionFailed,
  invalid_category: t.modules.items.errors.invalidCategory,
  invalid_item_id: t.modules.items.errors.invalidItemId,
  invalid_item_type: t.modules.items.errors.invalidItemType,
  invalid_location: t.modules.items.errors.invalidLocation,
  invalid_quantity: t.modules.items.errors.invalidQuantity,
  invalid_restore_status: t.modules.items.errors.invalidRestoreStatus,
  item_has_files: t.modules.items.errors.itemHasFiles,
  item_not_available: t.modules.items.errors.itemNotAvailable,
  item_already_archived: t.modules.items.errors.itemAlreadyArchived,
  item_not_archived: t.modules.items.errors.itemNotArchived,
  item_not_found: t.modules.items.errors.itemNotFound,
  missing_fields: t.modules.items.errors.missingFields,
  restore_status_required: t.modules.items.errors.restoreStatusRequired,
};

const statusMessages: Record<string, string> = {
  item_archived: t.modules.items.feedback.itemArchived,
  item_copied: t.modules.items.feedback.itemCopied,
  item_deleted: t.modules.items.feedback.itemDeleted,
  item_restored: t.modules.items.feedback.itemRestored,
  item_created: t.modules.items.feedback.itemCreated,
  item_updated: t.modules.items.feedback.itemUpdated,
};

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  const params = await searchParams;
  const { profile, supabase } = await getAppContext();

  const currentView = parseItemView(params);
  const itemsQueryBase = supabase
    .from("item")
    .select("*")
    .order("created_at", { ascending: false });
  const itemsQuery =
    currentView === "archived"
      ? itemsQueryBase.eq("status", "archiwalne")
      : itemsQueryBase.neq("status", "archiwalne");

  const [itemsResponse, categoriesResponse, roomsResponse] = await Promise.all([
    itemsQuery,
    supabase
      .from("category")
      .select("id, household_id, key, nazwa, czy_systemowa")
      .order("czy_systemowa", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("room")
      .select("id, nazwa")
      .order(orderColumn, { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const rooms = roomsResponse.data ?? [];
  const roomIds = rooms.map((room) => room.id);
  const items = itemsResponse.data ?? [];
  const itemIds = items.map((item) => item.id);
  const [storageResponse, primaryLocationsResponse] = await Promise.all([
    roomIds.length
      ? supabase
          .from("storage_location_l2")
          .select("id, nazwa, room_id")
          .in("room_id", roomIds)
          .order(orderColumn, { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    itemIds.length
      ? supabase
          .from("item_location")
          .select("item_id, storage_location_l3_id")
          .eq("czy_glowna", true)
          .in("item_id", itemIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const storageLocations = storageResponse.data ?? [];
  const storageIds = storageLocations.map((storage) => storage.id);
  const positionsResponse = storageIds.length
    ? await supabase
        .from("storage_location_l3")
        .select("id, nazwa, kod_lokalizacji, storage_location_l2_id")
        .in("storage_location_l2_id", storageIds)
        .order(orderColumn, { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [], error: null };
  const positions = positionsResponse.data ?? [];
  const primaryLocations = primaryLocationsResponse.data ?? [];
  const categories = categoriesResponse.data ?? [];
  const locationSelectorOptions = buildItemLocationSelectorOptions({
    positions,
    rooms,
    storageLocations,
  });

  const primaryPositionByItemId = new Map(
    primaryLocations.map((location) => [
      location.item_id,
      location.storage_location_l3_id,
    ]),
  );
  const categoryOptions: ItemCategoryOption[] = getItemCategoryOptions(
    categories,
    profile?.household_id,
  );
  const defaultCategoryId = getDefaultItemCategoryId(categories);
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.nazwa]),
  );
  const categoryKeyById = new Map(
    categories.map((category) => [category.id, category.key]),
  );
  const visibleItems = filterItemsForView(
    items,
    primaryPositionByItemId,
    currentView,
  );
  const emptyText =
    currentView === "unlocated"
      ? t.modules.items.emptyUnlocated
      : currentView === "archived"
        ? t.modules.items.emptyArchived
        : t.modules.items.empty;
  const emptyIcon =
    currentView === "unlocated" ? (
      <MapPinLineIcon aria-hidden="true" size={28} />
    ) : currentView === "archived" ? (
      <ArchiveIcon aria-hidden="true" size={28} />
    ) : (
      <PackageIcon aria-hidden="true" size={28} />
    );
  const viewLinks: { href: string; icon: "all" | "unlocated" | "archived"; label: string; view: ItemView }[] = [
    {
      href: "/items",
      icon: "all",
      label: t.modules.items.views.all,
      view: "all",
    },
    {
      href: "/items?view=unlocated",
      icon: "unlocated",
      label: t.modules.items.views.unlocated,
      view: "unlocated",
    },
    {
      href: "/items?view=archived",
      icon: "archived",
      label: t.modules.items.views.archived,
      view: "archived",
    },
  ];
  const isAdmin = profile?.rola === "admin" && profile.status === "aktywny";
  const canCopy = profile?.status === "aktywny" &&
    (profile.rola === "admin" || profile.rola === "domownik");
  const hasReadError = Boolean(
    itemsResponse.error ||
      categoriesResponse.error ||
      roomsResponse.error ||
      storageResponse.error ||
      positionsResponse.error ||
      primaryLocationsResponse.error,
  );
  const errorMessage = params.error
    ? (errorMessages[params.error] ?? t.modules.items.errors.unknown)
    : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <details className="space-y-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 border-b border-line pb-6 [&::-webkit-details-marker]:hidden">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground">
              {t.modules.items.title}
            </h1>
            <span className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-strong">
              <PlusIcon aria-hidden="true" size={18} weight="bold" />
              {t.modules.items.addItem}
            </span>
          </summary>
          <div className="w-full rounded-md border border-line bg-surface p-5">
            <ItemForm
              action={createItem}
              categories={categoryOptions}
              defaultCategoryId={defaultCategoryId}
              locationOptions={locationSelectorOptions}
              submitLabel={t.modules.items.createItem}
            />
          </div>
        </details>
      ) : (
        <header className="border-b border-line pb-6">
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">
            {t.modules.items.title}
          </h1>
        </header>
      )}
      <section className="border-b border-line pb-5">
        {!isAdmin ? (
          <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-muted">
            {t.modules.items.readOnly}
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
        {hasReadError ? (
          <p className="mt-3 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {t.modules.items.errors.actionFailed}
          </p>
        ) : null}
        <nav
          aria-label={t.modules.items.viewSelector}
          className="mt-4 flex flex-wrap gap-2"
        >
          {viewLinks.map((link) => (
            <Link
              className={`inline-flex items-center rounded-md border px-3 py-2 text-sm font-semibold ${
                currentView === link.view
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-primary-strong hover:border-primary/60"
              }`}
              href={link.href}
              key={link.view}
            >
              {link.icon === "all" ? (
                <ListBulletsIcon aria-hidden="true" className="mr-2" size={18} />
              ) : link.icon === "unlocated" ? (
                <MapPinLineIcon aria-hidden="true" className="mr-2" size={18} />
              ) : (
                <ArchiveIcon aria-hidden="true" className="mr-2" size={18} />
              )}
              {link.label}
            </Link>
          ))}
        </nav>
      </section>
      {visibleItems.length ? (
        <section className="grid gap-3 lg:grid-cols-2">
          {visibleItems.map((item) => {
            const positionId = primaryPositionByItemId.get(item.id) ?? null;
            const location =
              locationSelectorOptions.positions.find(
                (option) => option.id === positionId,
              ) ?? null;

            return (
              <ItemCard
                canCopy={canCopy}
                categories={categoryOptions}
                categoryKey={categoryKeyById.get(item.category_id) ?? null}
                categoryName={
                  categoryNameById.get(item.category_id) ??
                  t.modules.items.categoryUnavailable
                }
                isAdmin={isAdmin}
                item={item}
                key={item.id}
                location={location}
                locationOptions={locationSelectorOptions}
              />
            );
          })}
        </section>
      ) : (
        <EmptyState icon={emptyIcon} text={emptyText} />
      )}
    </div>
  );
}
