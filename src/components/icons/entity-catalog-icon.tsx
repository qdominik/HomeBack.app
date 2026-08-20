"use client";

import { useEffect, useState } from "react";
import { QuestionIcon } from "@phosphor-icons/react/dist/csr/Question";
import type { PhosphorIconComponent } from "./phosphor-icon-loaders";

type EntityCatalogIconProps = {
  className?: string;
  iconName: string;
  size: number;
  weight: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
};

export function EntityCatalogIcon({ className, iconName, size, weight }: EntityCatalogIconProps) {
  const [Icon, setIcon] = useState<PhosphorIconComponent | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      import("@/lib/icons/phosphor-icon-registry"),
      import("./phosphor-icon-loaders"),
    ]).then(([registry, loaders]) => {
      const entry = registry.getPhosphorIconManifestEntry(iconName);
      if (!entry) return;
      return loaders.PHOSPHOR_ICON_GROUP_LOADERS[entry.group]().then((module) => {
        const component = module.ICONS[entry.name];
        if (!cancelled) setIcon(component ?? null);
      });
    }).catch(() => {
      if (!cancelled) setIcon(null);
    });
    return () => { cancelled = true; };
  }, [iconName]);

  if (!Icon) {
    return <QuestionIcon aria-label={iconName} className={className} size={size} weight={weight} />;
  }

  return <Icon aria-hidden="true" className={className} size={size} weight={weight} />;
}
