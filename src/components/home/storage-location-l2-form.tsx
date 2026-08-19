"use client";

import { useState } from "react";
import { TemplateOrCustomField } from "@/components/form/template-or-custom-field";
import { EntityIconPicker } from "@/components/icons/entity-icon-picker";
import { Button } from "@/components/ui/button";
import {
  FURNITURE_CUSTOM_TEMPLATE_VALUES,
  getFurnitureTemplateOptions,
} from "@/lib/home/home-template-options";
import { inferHomeKind } from "@/lib/home/infer-home-kind";
import { resolveStorageLocationIconKey } from "@/lib/icons/home-structure-icons";
import { activeLocale, t } from "@/lib/i18n";
import type { StorageLocationL2 } from "./home-types";

type StorageLocationL2FormProps = {
  action: (formData: FormData) => Promise<void>;
  location?: StorageLocationL2;
  roomId: string;
  submitLabel: string;
};

const orderColumn = "kolejno\u015b\u0107" as const;
const furnitureTemplateOptions = getFurnitureTemplateOptions(activeLocale);
const furnitureCustomOption = FURNITURE_CUSTOM_TEMPLATE_VALUES[activeLocale];

export function StorageLocationL2Form({
  action,
  location,
  roomId,
  submitLabel,
}: StorageLocationL2FormProps) {
  const [inferredKind, setInferredKind] = useState<string | null>(null);

  function handleNameChange(value: string) {
    if (location) {
      return;
    }

    setInferredKind(inferHomeKind(value, "storage", activeLocale));
  }

  return (
    <form action={action} className="space-y-4">
      <input name="room_id" type="hidden" value={roomId} />
      {location ? (
        <input name="location_l2_id" type="hidden" value={location.id} />
      ) : null}
      <label className="ui-label">
        {t.modules.home.fields.storageName}
        <input
          className="ui-control mt-2"
          defaultValue={location?.nazwa}
          name="nazwa"
          onChange={(event) => handleNameChange(event.currentTarget.value)}
          required
        />
      </label>
      <TemplateOrCustomField
        customLabel={t.modules.home.fields.customStorageType}
        customOption={furnitureCustomOption}
        defaultValue={location?.typ}
        helpText={t.modules.home.fields.typeHelp}
        inferredValue={inferredKind}
        label={t.modules.home.fields.storageType}
        name="typ"
        templateOptions={furnitureTemplateOptions}
      />
      <EntityIconPicker
        defaultValue={resolveStorageLocationIconKey(
          location?.typ,
          location?.ikona,
        )}
        group="storage"
        label={t.modules.home.fields.icon}
        name="ikona"
      />
      <p className="text-sm text-muted">{t.modules.home.fields.storageHelp}</p>
      <label className="ui-label">
        {t.modules.home.fields.order}
        <input
          className="ui-control mt-2"
          defaultValue={location?.[orderColumn]}
          min="0"
          name="kolejnosc"
          type="number"
        />
      </label>
      <label className="ui-label">
        {t.modules.home.fields.description}
        <textarea
          className="ui-control ui-textarea mt-2"
          defaultValue={location?.opis ?? ""}
          name="opis"
        />
      </label>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
