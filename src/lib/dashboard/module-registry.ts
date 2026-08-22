export type DashboardModuleStatus = "available" | "soon";

export type DashboardModuleDefinition = {
  key: string;
  status: DashboardModuleStatus;
  title: { pl: string; en: string };
  description?: { pl: string; en: string };
  defaultVisible: boolean;
};

export const dashboardModuleDefinitions: DashboardModuleDefinition[] = [
  {
    key: "recent-items",
    status: "soon",
    title: { pl: "Ostatnio dodane", en: "Recently added" },
    description: { pl: "Podgląd ostatnio dodanych rzeczy pojawi się tutaj.", en: "A view of recently added items will appear here." },
    defaultVisible: true,
  },
  {
    key: "expiring-items",
    status: "soon",
    title: { pl: "Terminy ważności", en: "Expiration dates" },
    description: { pl: "Informacje o zbliżających się terminach pojawią się tutaj.", en: "Upcoming expiration information will appear here." },
    defaultVisible: true,
  },
  {
    key: "category-count",
    status: "soon",
    title: { pl: "Rzeczy według kategorii", en: "Items by category" },
    description: { pl: "Podsumowanie kategorii pojawi się tutaj.", en: "A category summary will appear here." },
    defaultVisible: true,
  },
  {
    key: "activity",
    status: "soon",
    title: { pl: "Ostatnia aktywność", en: "Recent activity" },
    description: { pl: "Aktywność gospodarstwa pojawi się tutaj.", en: "Household activity will appear here." },
    defaultVisible: true,
  },
];
