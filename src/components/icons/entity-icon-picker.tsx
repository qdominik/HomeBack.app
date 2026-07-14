"use client";

import { useMemo, useState } from "react";
import { EntityIcon } from "@/components/icons/entity-icon";
import {
  getEntityIconDefinition,
  getEntityIconFallback,
  normalizeEntityIconKey,
  searchEntityIconOptions,
  type EntityIconGroup,
} from "@/lib/icons/entity-icon-validation";
import { activeLocale, t } from "@/lib/i18n";

type EntityIconPickerProps = {
  defaultValue?: string | null;
  group: EntityIconGroup;
  label: string;
  name: string;
};

export function EntityIconPicker({
  defaultValue,
  group,
  label,
  name,
}: EntityIconPickerProps) {
  const initialIconKey = normalizeEntityIconKey(defaultValue, group);
  const [selectedIconKey, setSelectedIconKey] = useState(initialIconKey);
  const [query, setQuery] = useState("");
  const locale = activeLocale;
  const selectedDefinition =
    getEntityIconDefinition(selectedIconKey) ??
    getEntityIconDefinition(getEntityIconFallback(group));
  const options = useMemo(
    () => searchEntityIconOptions(query, group),
    [group, query],
  );

  return (
    <fieldset className="space-y-3">
      <legend className="ui-label">{label}</legend>
      <input name={name} type="hidden" value={selectedIconKey} />
      <div className="flex items-center gap-3 rounded-control border border-line bg-surface-muted p-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-control bg-surface text-primary">
          <EntityIcon
            group={group}
            iconKey={selectedIconKey}
            size={24}
            weight="duotone"
          />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {selectedDefinition?.label[locale] ?? selectedIconKey}
          </p>
          <p className="text-xs leading-5 text-muted">
            {t.modules.home.iconPicker.selected}
          </p>
        </div>
      </div>
      <label className="ui-label">
        {t.modules.home.iconPicker.search}
        <input
          className="ui-control mt-2"
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder={t.modules.home.iconPicker.placeholder}
          type="search"
          value={query}
        />
      </label>
      <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-control border border-line bg-surface p-2 sm:grid-cols-3">
        {options.map((definition) => {
          const isSelected = definition.key === selectedIconKey;

          return (
            <button
              aria-pressed={isSelected}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-control border px-2 py-3 text-center text-xs font-semibold transition-colors focus-visible:outline-none ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary-hover"
                  : "border-line bg-surface text-foreground hover:border-primary"
              }`}
              key={definition.key}
              onClick={() => setSelectedIconKey(definition.key)}
              type="button"
            >
              <EntityIcon
                group={group}
                iconKey={definition.key}
                size={24}
                weight={isSelected ? "duotone" : "regular"}
              />
              <span>{definition.label[locale]}</span>
            </button>
          );
        })}
      </div>
      {options.length === 0 ? (
        <p className="text-sm text-muted">{t.modules.home.iconPicker.noResults}</p>
      ) : null}
    </fieldset>
  );
}
