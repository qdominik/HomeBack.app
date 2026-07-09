export const routes = {
  dashboard: "/dashboard",
  items: "/items",
  home: "/home",
  family: "/family",
  documents: "/documents",
  categories: "/categories",
  settings: "/settings",
  login: "/login",
  register: "/register",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
