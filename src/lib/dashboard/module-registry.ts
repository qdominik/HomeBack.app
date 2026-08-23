import type { Dictionary } from "../i18n/types";
import type { EntityIconKey } from "../icons/entity-icon-definitions";
import type { Database } from "../../types/database";

export type DashboardModuleStatus = "available" | "soon";

export type DashboardModuleRole = Database["public"]["Enums"]["profile_role"];

export type DashboardModuleCopyKey = keyof Dictionary["dashboardModules"];

export const DASHBOARD_MODULE_KEYS = [
  "recent-items",
  "expiring-items",
  "category-count",
  "activity",
  "rooms",
  "documents",
  "school-schedule",
  "shopping-list",
] as const;

export type DashboardModuleKey = (typeof DASHBOARD_MODULE_KEYS)[number];

export type DashboardModuleDefinition = {
  key: DashboardModuleKey;
  status: DashboardModuleStatus;
  titleKey: DashboardModuleCopyKey;
  descriptionKey: DashboardModuleCopyKey;
  icon: EntityIconKey;
  defaultVisible: boolean;
  /**
   * Undefined/empty means the module is visible to every household role.
   * When set, the signed-in profile role must be included.
   */
  requiredRoles?: DashboardModuleRole[];
};

export const dashboardModuleDefinitions: DashboardModuleDefinition[] = [
  {
    key: "recent-items",
    status: "soon",
    titleKey: "recentItems",
    descriptionKey: "recentItems",
    icon: "package",
    defaultVisible: true,
  },
  {
    key: "expiring-items",
    status: "soon",
    titleKey: "expiringItems",
    descriptionKey: "expiringItems",
    icon: "shield-check",
    defaultVisible: true,
  },
  {
    key: "category-count",
    status: "soon",
    titleKey: "categoryCount",
    descriptionKey: "categoryCount",
    icon: "cube",
    defaultVisible: true,
  },
  {
    key: "activity",
    status: "soon",
    titleKey: "activity",
    descriptionKey: "activity",
    icon: "heart",
    defaultVisible: true,
  },
  {
    key: "rooms",
    status: "soon",
    titleKey: "rooms",
    descriptionKey: "rooms",
    icon: "room",
    defaultVisible: false,
  },
  {
    key: "documents",
    status: "soon",
    titleKey: "documents",
    descriptionKey: "documents",
    icon: "documents",
    defaultVisible: false,
  },
  {
    key: "school-schedule",
    status: "soon",
    titleKey: "schoolSchedule",
    descriptionKey: "schoolSchedule",
    icon: "graduation-cap",
    defaultVisible: false,
  },
  {
    key: "shopping-list",
    status: "soon",
    titleKey: "shoppingList",
    descriptionKey: "shoppingList",
    icon: "box",
    defaultVisible: false,
  },
];

const definitionsByKey = new Map(
  dashboardModuleDefinitions.map((definition) => [definition.key, definition]),
);

export function getDashboardModuleDefinition(
  key: DashboardModuleKey,
): DashboardModuleDefinition | null {
  return definitionsByKey.get(key) ?? null;
}
