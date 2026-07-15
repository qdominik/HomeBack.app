"use client";

import { useId, useMemo, useRef, useState } from "react";
import { EntityIcon } from "@/components/icons/entity-icon";
import {
  getEntityIconDefinition,
  getEntityIconFallback,
  normalizeEntityIconKey,
  searchEntityIconOptions,
  type EntityIconGroup,
  type EntityIconKey,
} from "@/lib/icons/entity-icon-validation";
import { activeLocale, t } from "@/lib/i18n";

type EntityIconPickerProps = {
  defaultValue?: string | null;
  dialogTitle?: string;
  group: EntityIconGroup;
  helpText?: string;
  label: string;
  name: string;
  onValueChange?: (value: EntityIconKey) => void;
  triggerLabel?: string;
  value?: string | null;
};

export function EntityIconPicker({
  defaultValue,
  dialogTitle,
  group,
  helpText,
  label,
  name,
  onValueChange,
  triggerLabel,
  value,
}: EntityIconPickerProps) {
  const initialIconKey = normalizeEntityIconKey(defaultValue, group);
  const [uncontrolledIconKey, setUncontrolledIconKey] = useState(initialIconKey);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogTitleId = useId();
  const dialogId = useId();
  const locale = activeLocale;
  const selectedIconKey = normalizeEntityIconKey(
    value === undefined ? uncontrolledIconKey : value,
    group,
  );
  const selectedDefinition =
    getEntityIconDefinition(selectedIconKey) ??
    getEntityIconDefinition(getEntityIconFallback(group));
  const options = useMemo(
    () => searchEntityIconOptions(query, group),
    [group, query],
  );

  function openPicker() {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    dialog.showModal();
    setIsOpen(true);
  }

  function closePicker() {
    dialogRef.current?.close();
    setIsOpen(false);
  }

  function selectIcon(iconKey: string) {
    const nextIconKey = normalizeEntityIconKey(iconKey, group);

    if (value === undefined) {
      setUncontrolledIconKey(nextIconKey);
    }

    onValueChange?.(nextIconKey);
    closePicker();
  }

  return (
    <fieldset className="space-y-2">
      <legend className="ui-label">{label}</legend>
      <input name={name} type="hidden" value={selectedIconKey} />
      <div className="flex items-center gap-3">
        <button
          aria-controls={dialogId}
          aria-expanded={isOpen}
          aria-label={triggerLabel ?? t.modules.home.iconPicker.change}
          className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-primary transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={openPicker}
          type="button"
        >
          <EntityIcon
            group={group}
            iconKey={selectedIconKey}
            size={24}
            weight="duotone"
          />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {selectedDefinition?.label[locale] ?? selectedIconKey}
          </p>
          <p className="text-xs leading-5 text-muted">
            {helpText ?? t.modules.home.iconPicker.help}
          </p>
        </div>
      </div>

      <dialog
        aria-labelledby={dialogTitleId}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-xl rounded-card border border-line bg-surface p-0 text-foreground shadow-card backdrop:bg-foreground/35"
        id={dialogId}
        onClose={() => setIsOpen(false)}
        ref={dialogRef}
      >
        <div className="flex max-h-[min(36rem,calc(100vh-2rem))] flex-col p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold" id={dialogTitleId}>
              {dialogTitle ?? t.modules.home.iconPicker.dialogTitle}
            </h2>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-control px-3 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={closePicker}
              type="button"
            >
              {t.modules.home.iconPicker.close}
            </button>
          </div>
          <label className="ui-label mt-4">
            {t.modules.home.iconPicker.search}
            <input
              autoFocus
              className="ui-control mt-2"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder={t.modules.home.iconPicker.placeholder}
              type="search"
              value={query}
            />
          </label>
          <div className="mt-4 min-h-0 overflow-y-auto">
            {options.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {options.map((definition) => {
                  const isSelected = definition.key === selectedIconKey;
                  const buttonClassName = isSelected
                    ? "flex aspect-square min-h-11 items-center justify-center rounded-control border border-primary bg-primary/10 text-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    : "flex aspect-square min-h-11 items-center justify-center rounded-control border border-line bg-surface text-foreground transition-colors hover:border-primary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

                  return (
                    <button
                      aria-label={definition.label[locale]}
                      aria-pressed={isSelected}
                      className={buttonClassName}
                      key={definition.key}
                      onClick={() => selectIcon(definition.key)}
                      type="button"
                    >
                      <EntityIcon
                        group={group}
                        iconKey={definition.key}
                        size={22}
                        weight={isSelected ? "duotone" : "regular"}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">{t.modules.home.iconPicker.noResults}</p>
            )}
          </div>
        </div>
      </dialog>
    </fieldset>
  );
}