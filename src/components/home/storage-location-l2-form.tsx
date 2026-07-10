"use client";

import { useState } from "react";
import { TemplateOrCustomField } from "@/components/form/template-or-custom-field";
import { STORAGE_LOCATION_TEMPLATE_OPTIONS } from "@/lib/home/home-template-options";
import { inferHomeKind } from "@/lib/home/infer-home-kind";
import { t } from "@/lib/i18n";
import type { StorageLocationL2 } from "./home-types";

type StorageLocationL2FormProps = {
  action: (formData: FormData) => Promise<void>;
  location?: StorageLocationL2;
  roomId: string;
  submitLabel: string;
};

const orderColumn = "kolejność" as const;

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

    setInferredKind(inferHomeKind(value, "storage"));
  }

  return (
    <form action={action} className="space-y-3">
      <input name="room_id" type="hidden" value={roomId} />
      {location ? (
        <input name="location_l2_id" type="hidden" value={location.id} />
      ) : null}
      <label className="block text-sm font-medium">
        {t.modules.home.fields.name}
        <input
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
          defaultValue={location?.nazwa}
          name="nazwa"
          onChange={(event) => handleNameChange(event.currentTarget.value)}
          required
        />
      </label>
      <TemplateOrCustomField
        customLabel={t.modules.home.fields.customStorageType}
        defaultValue={location?.typ}
        helpText={t.modules.home.fields.typeHelp}
        inferredValue={inferredKind}
        label={t.modules.home.fields.type}
        name="typ"
        templateOptions={STORAGE_LOCATION_TEMPLATE_OPTIONS}
      />
      <label className="block text-sm font-medium">
        {t.modules.home.fields.order}
        <input
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
          defaultValue={location?.[orderColumn]}
          min="0"
          name="kolejnosc"
          type="number"
        />
      </label>
      <label className="block text-sm font-medium">
        {t.modules.home.fields.description}
        <textarea
          className="mt-1 min-h-20 w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-primary"
          defaultValue={location?.opis ?? ""}
          name="opis"
        />
      </label>
      <button
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-strong"
        type="submit"
      >
        {submitLabel}
      </button>
    </form>
  );
}
