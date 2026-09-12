import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { EntityIcon } from "@/components/icons/entity-icon";
import { ItemPhotoThumbnail } from "@/components/items/item-photo-thumbnail";
import type { DashboardWidgetData } from "@/lib/dashboard/dashboard-widgets";
import { t } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import {
  dashboardModuleDefinitions,
  type DashboardModuleDefinition,
} from "@/lib/dashboard/module-registry";

export type DashboardModuleRenderer = ComponentType<{
  data: DashboardWidgetData;
  definition: DashboardModuleDefinition;
}>;

export type DashboardModuleRegistration = {
  definition: DashboardModuleDefinition;
  /**
   * Body renderer. Soon modules delegate to the shared SoonModuleBody
   * placeholder and must never render functional content. When a module
   * becomes available, its entry in `renderers` is swapped for the real
   * implementation.
   */
  Render: DashboardModuleRenderer;
};

export function SoonModuleBody() {
  return (
    <div className="mt-auto pt-4">
      <p className="rounded-control border border-dashed border-line bg-surface-muted/60 px-4 py-3 text-center text-sm font-medium text-muted">
        {t.status.soonDescription}
      </p>
    </div>
  );
}

function WidgetMessage({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <p
      className={`mt-4 rounded-control border px-4 py-3 text-sm font-medium ${
        error
          ? "border-danger/30 bg-danger/5 text-danger"
          : "border-dashed border-line bg-surface-muted/60 text-center text-muted"
      }`}
      role={error ? "alert" : "status"}
    >
      {children}
    </p>
  );
}

function formatItemCount(count: number) {
  return t.dashboard.itemCount.replace("{count}", String(count));
}

export function RecentItemsDashboardModule({ data }: { data: DashboardWidgetData }) {
  if (data.recentItems.kind === "error") {
    return <WidgetMessage error>{t.dashboard.widgetReadError}</WidgetMessage>;
  }

  if (!data.recentItems.data.length) {
    return <WidgetMessage>{t.dashboard.emptyRecentItems}</WidgetMessage>;
  }

  return (
    <ul className="mt-4 min-w-0 divide-y divide-line" data-widget-content="recent-items">
      {data.recentItems.data.map((item) => (
        <li key={item.id}>
          <Link
            className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0 hover:text-primary-strong"
            href={`${routes.items}?focus=${item.id}`}
          >
            <ItemPhotoThumbnail
              alt={item.name}
              iconKey={item.iconKey}
              previewUrl={item.previewUrl}
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">
                {item.name}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted">
                {item.location ?? t.dashboard.itemSearch.noLocation}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ExpiringItemsDashboardModule() {
  return <SoonModuleBody />;
}

export function CategoryCountDashboardModule({ data }: { data: DashboardWidgetData }) {
  if (data.categories.kind === "error") {
    return <WidgetMessage error>{t.dashboard.widgetReadError}</WidgetMessage>;
  }

  if (!data.categories.data.length) {
    return <WidgetMessage>{t.dashboard.emptyCategoryCounts}</WidgetMessage>;
  }

  return (
    <ul className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2" data-widget-content="category-count">
      {data.categories.data.map((category) => (
        <li className="min-w-0" key={category.id}>
          <Link
            className="flex min-h-12 min-w-0 items-center gap-3 rounded-control border border-line bg-surface-muted/40 px-3 py-2 hover:border-primary/50"
            href={`${routes.items}?category=${category.id}`}
          >
            <EntityIcon
              className="shrink-0 text-primary"
              group="item"
              iconKey={category.iconKey}
              size={20}
              weight="duotone"
            />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
              {category.name}
            </span>
            <span
              aria-label={formatItemCount(category.count)}
              className="inline-flex min-w-7 justify-center rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary-strong"
            >
              {category.count}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ActivityDashboardModule() {
  return <SoonModuleBody />;
}

export function RoomsDashboardModule({ data }: { data: DashboardWidgetData }) {
  if (data.rooms.kind === "error") {
    return <WidgetMessage error>{t.dashboard.widgetReadError}</WidgetMessage>;
  }

  if (!data.rooms.data.length) {
    return <WidgetMessage>{t.dashboard.emptyRooms}</WidgetMessage>;
  }

  return (
    <ul className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2" data-widget-content="rooms">
      {data.rooms.data.map((room) => (
        <li className="min-w-0" key={room.id}>
          <Link
            className="flex min-h-12 min-w-0 items-center gap-3 rounded-control border border-line bg-surface-muted/40 px-3 py-2 hover:border-primary/50"
            href={`${routes.home}#room-${room.id}`}
          >
            <EntityIcon
              className="shrink-0 text-primary"
              group="room"
              iconKey={room.iconKey}
              size={20}
              weight="duotone"
            />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
              {room.name}
            </span>
            <span className="shrink-0 text-xs font-medium text-muted">
              {formatItemCount(room.itemCount)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function DocumentsDashboardModule() {
  return <SoonModuleBody />;
}

export function SchoolScheduleDashboardModule() {
  return <SoonModuleBody />;
}

export function ShoppingListDashboardModule() {
  return <SoonModuleBody />;
}

const renderers: Record<
  DashboardModuleDefinition["key"],
  DashboardModuleRenderer
> = {
  "recent-items": RecentItemsDashboardModule,
  "expiring-items": ExpiringItemsDashboardModule,
  "category-count": CategoryCountDashboardModule,
  activity: ActivityDashboardModule,
  rooms: RoomsDashboardModule,
  documents: DocumentsDashboardModule,
  "school-schedule": SchoolScheduleDashboardModule,
  "shopping-list": ShoppingListDashboardModule,
};

/**
 * Runtime registry: single source combining module metadata with its
 * renderer. Dashboard and Settings both read from this list; personalization
 * uses only `definition`, rendering uses `Render`.
 */
export const dashboardModuleRegistrations: DashboardModuleRegistration[] =
  dashboardModuleDefinitions.map((definition) => ({
    definition,
    Render: renderers[definition.key],
  }));

const registrationsByKey = new Map(
  dashboardModuleRegistrations.map((registration) => [
    registration.definition.key,
    registration,
  ]),
);

export function getDashboardModuleRegistration(
  key: DashboardModuleDefinition["key"],
): DashboardModuleRegistration | null {
  return registrationsByKey.get(key) ?? null;
}

export function DashboardModuleIcon({
  definition,
  size = 20,
}: {
  definition: DashboardModuleDefinition;
  size?: number;
}) {
  return (
    <EntityIcon
      aria-hidden="true"
      className="shrink-0 text-primary"
      iconKey={definition.icon}
      size={size}
      weight="duotone"
    />
  );
}
