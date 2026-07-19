import { TemplateOrCustomField } from "@/components/form/template-or-custom-field";
import { Button } from "@/components/ui/button";
import {
  getStorageSpaceTemplateOptions,
  STORAGE_SPACE_CUSTOM_TEMPLATE_VALUES,
} from "@/lib/home/home-template-options";
import { activeLocale, t } from "@/lib/i18n";
import type { StorageLocationL3 } from "./home-types";

type StorageLocationL3FormProps = {
  action: (formData: FormData) => Promise<void>;
  locationId: string;
  position?: StorageLocationL3;
  submitLabel: string;
};

const orderColumn = "kolejno\u015b\u0107" as const;
const storageSpaceTemplateOptions =
  getStorageSpaceTemplateOptions(activeLocale);
const storageSpaceCustomOption =
  STORAGE_SPACE_CUSTOM_TEMPLATE_VALUES[activeLocale];

export function StorageLocationL3Form({
  action,
  locationId,
  position,
  submitLabel,
}: StorageLocationL3FormProps) {
  return (
    <form action={action} className="space-y-4">
      <input name="location_l2_id" type="hidden" value={locationId} />
      {position ? (
        <input name="location_l3_id" type="hidden" value={position.id} />
      ) : null}
      <TemplateOrCustomField
        customLabel={t.modules.home.fields.customPositionName}
        customOption={storageSpaceCustomOption}
        defaultValue={position?.nazwa}
        helpText={t.modules.home.fields.positionNameHelp}
        label={t.modules.home.fields.positionName}
        name="nazwa"
        templateOptions={storageSpaceTemplateOptions}
      />
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <label className="ui-label">
          {t.modules.home.fields.locationCode}
          <input
            className="ui-control mt-2"
            defaultValue={position?.kod_lokalizacji ?? ""}
            name="kod_lokalizacji"
            placeholder={t.modules.home.generatedCode}
          />
        </label>
        <label className="ui-label">
          {t.modules.home.fields.order}
          <input
            className="ui-control mt-2"
            defaultValue={position?.[orderColumn]}
            min="0"
            name="kolejnosc"
            type="number"
          />
        </label>
      </div>
      <label className="ui-label">
        {t.modules.home.fields.description}
        <textarea
          className="ui-control ui-textarea mt-2"
          defaultValue={position?.opis ?? ""}
          name="opis"
        />
      </label>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
