import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { StorageLocationL3 } from "./home-types";

type StorageLocationL3FormProps = {
  action: (formData: FormData) => Promise<void>;
  locationId: string;
  position?: StorageLocationL3;
  submitLabel: string;
};

const orderColumn = "kolejno\u015b\u0107" as const;

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
      <label className="ui-label">
        {t.modules.home.fields.positionName}
        <input
          className="ui-control mt-2"
          defaultValue={position?.nazwa}
          name="nazwa"
          required
        />
      </label>
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