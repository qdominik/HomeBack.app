import type { ComponentType } from "react";
import { EntityIcon } from "@/components/icons/entity-icon";
import { t } from "@/lib/i18n";
import {
  dashboardModuleDefinitions,
  type DashboardModuleDefinition,
} from "@/lib/dashboard/module-registry";

export type DashboardModuleRenderer = ComponentType<{
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

export function RecentItemsDashboardModule() {
  return <SoonModuleBody />;
}

export function ExpiringItemsDashboardModule() {
  return <SoonModuleBody />;
}

export function CategoryCountDashboardModule() {
  return <SoonModuleBody />;
}

export function ActivityDashboardModule() {
  return <SoonModuleBody />;
}

export function RoomsDashboardModule() {
  return <SoonModuleBody />;
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
