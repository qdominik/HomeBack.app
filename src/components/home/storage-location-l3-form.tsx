import { t } from "@/lib/i18n";
import type { StorageLocationL3 } from "./home-types";

type StorageLocationL3FormProps = {
  action: (formData: FormData) => Promise<void>;
  locationId: string;
  position?: StorageLocationL3;
  submitLabel: string;
};

const orderColumn = "kolejność" as const;

export function StorageLocationL3Form({
  action,
  locationId,
  position,
  submitLabel,
}: StorageLocationL3FormProps) {
  return (
    <form action={action} className="space-y-3">
      <input name="location_l2_id" type="hidden" value={locationId} />
      {position ? (
        <input name="location_l3_id" type="hidden" value={position.id} />
      ) : null}
      <label className="block text-sm font-medium">
        {t.modules.home.fields.name}
        <input
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
          defaultValue={position?.nazwa}
          name="nazwa"
          required
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
        <label className="block text-sm font-medium">
          {t.modules.home.fields.locationCode}
          <input
            className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
            defaultValue={position?.kod_lokalizacji ?? ""}
            name="kod_lokalizacji"
            placeholder={t.modules.home.generatedCode}
          />
        </label>
        <label className="block text-sm font-medium">
          {t.modules.home.fields.order}
          <input
            className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
            defaultValue={position?.[orderColumn]}
            min="0"
            name="kolejnosc"
            type="number"
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        {t.modules.home.fields.description}
        <textarea
          className="mt-1 min-h-20 w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-primary"
          defaultValue={position?.opis ?? ""}
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
