import type { DashboardModuleRole } from "./module-registry";

export type RoleRestrictedModule = {
  key?: string;
  requiredRoles?: DashboardModuleRole[];
};

/**
 * Single access rule for Dashboard modules:
 * - no requiredRoles (or empty) -> visible to every signed-in profile;
 * - requiredRoles set -> the profile role must be included;
 * - unknown/missing role -> role-restricted modules stay hidden.
 */
export function isDashboardModuleVisibleForRole<
  T extends RoleRestrictedModule,
>(module: T, role: DashboardModuleRole | null | undefined): boolean {
  const required = module.requiredRoles;

  if (!required || required.length === 0) {
    return true;
  }

  if (!role) {
    return false;
  }

  return required.includes(role);
}

export function filterDashboardModulesForRole<
  T extends RoleRestrictedModule,
>(modules: T[], role: DashboardModuleRole | null | undefined): T[] {
  return modules.filter((module) => isDashboardModuleVisibleForRole(module, role));
}
