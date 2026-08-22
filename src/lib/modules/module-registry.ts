export type AppModuleStatus = "available" | "soon";

export type AppModuleKey =
  | "dashboard"
  | "items"
  | "home"
  | "family"
  | "documents"
  | "categories"
  | "settings";

export type AppModuleDefinition = {
  key: AppModuleKey;
  status: AppModuleStatus;
};

export const appModuleDefinitions: Record<AppModuleKey, AppModuleDefinition> = {
  dashboard: { key: "dashboard", status: "available" },
  items: { key: "items", status: "available" },
  home: { key: "home", status: "available" },
  family: { key: "family", status: "soon" },
  documents: { key: "documents", status: "soon" },
  categories: { key: "categories", status: "available" },
  settings: { key: "settings", status: "available" },
};
