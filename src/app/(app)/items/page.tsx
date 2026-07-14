import Link from "next/link";
import { createItem } from "@/app/(app)/items/actions";
import { ItemCard } from "@/components/items/item-card";
import { ItemForm } from "@/components/items/item-form";
import { EmptyState } from "@/components/empty-state";
import { ModulePage } from "@/components/module-page";
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
import { createClient } from "@/lib/supabase/server";

type ItemsPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
    view?: string | string[];
  }>;
};

const orderColumn = "kolejność" as const;

const errorMessages: Record<string, string> = {
  action_failed: t.modules.items.errors.actionFailed,
  admin_required: t.modules.items.errors.adminRequired,
  invalid_category: t.modules.items.errors.invalidCategory,
  invalid_item_type: t.modules.items.errors.invalidItemType,
  invalid_location: t.modules.items.errors.invalidLocation,
  invalid_quantity: t.modules.items.errors.invalidQuantity,
  item_not_found: t.modules.items.errors.itemNotFound,
  missing_fields: t.modules.items.errors.missingFields,
};

const statusMessages: Record<string, string> = {
  item_archived: t.modules.items.feedback.itemArchived,
  item_created: t.modules.items.feedback.itemCreated,
  item_updated: t.modules.items.feedback.itemUpdated,
};

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
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
  const storageResponse = roomIds.length
    ? await supabase
        .from("storage_location_l2")
        .select("id, nazwa, room_id")
        .in("room_id", roomIds)
        .order(orderColumn, { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [], error: null };
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
  const items = itemsResponse.data ?? [];
  const itemIds = items.map((item) => item.id);
  const primaryLocationsResponse = itemIds.length
    ? await supabase
        .from("item_location")
        .select("item_id, storage_location_l3_id")
        .eq("czy_glowna", true)
        .in("item_id", itemIds)
    : { data: [], error: null };
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
  const viewLinks: { href: string; label: string; view: ItemView }[] = [
    {
      href: "/items",
      label: t.modules.items.views.all,
      view: "all",
    },
    {
      href: "/items?view=unlocated",
      label: t.modules.items.views.unlocated,
      view: "unlocated",
    },
    {
      href: "/items?view=archived",
      label: t.modules.items.views.archived,
      view: "archived",
    },
  ];
  const isAdmin = profile?.rola === "admin";
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
    <ModulePage
      action={
        isAdmin ? (
          <details className="w-full rounded-md border border-line bg-surface p-3 sm:w-auto sm:min-w-80">
            <summary className="cursor-pointer text-sm font-semibold text-primary-strong">
              {t.modules.items.addItem}
            </summary>
            <div className="mt-4">
              <ItemForm
                action={createItem}
                categories={categoryOptions}
                defaultCategoryId={defaultCategoryId}
                locationOptions={locationSelectorOptions}
                submitLabel={t.modules.items.createItem}
              />
            </div>
          </details>
        ) : null
      }
      title={t.modules.items.title}
    >
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
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                currentView === link.view
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-primary-strong hover:border-primary/60"
              }`}
              href={link.href}
              key={link.view}
            >
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
                categories={categoryOptions}
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
        <EmptyState text={emptyText} />
      )}
    </ModulePage>
  );
}
