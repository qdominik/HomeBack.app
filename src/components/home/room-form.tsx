"use client";

import { useState } from "react";
import { TemplateOrCustomField } from "@/components/form/template-or-custom-field";
import { ROOM_TEMPLATE_OPTIONS } from "@/lib/home/home-template-options";
import { inferHomeKind } from "@/lib/home/infer-home-kind";
import { t } from "@/lib/i18n";
import type { Room } from "./home-types";

type RoomFormProps = {
  action: (formData: FormData) => Promise<void>;
  room?: Room;
  submitLabel: string;
};

const orderColumn = "kolejność" as const;

export function RoomForm({ action, room, submitLabel }: RoomFormProps) {
  const [inferredKind, setInferredKind] = useState<string | null>(null);

  function handleNameChange(value: string) {
    if (room) {
      return;
    }

    setInferredKind(inferHomeKind(value, "room"));
  }

  return (
    <form action={action} className="space-y-3">
      {room ? <input name="room_id" type="hidden" value={room.id} /> : null}
      <label className="block text-sm font-medium">
        {t.modules.home.fields.name}
        <input
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
          defaultValue={room?.nazwa}
          name="nazwa"
          onChange={(event) => handleNameChange(event.currentTarget.value)}
          required
        />
      </label>
      <TemplateOrCustomField
        customLabel={t.modules.home.fields.customRoomType}
        defaultValue={room?.typ}
        helpText={t.modules.home.fields.typeHelp}
        inferredValue={inferredKind}
        label={t.modules.home.fields.type}
        name="typ"
        templateOptions={ROOM_TEMPLATE_OPTIONS}
      />
      <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
        <label className="block text-sm font-medium">
          {t.modules.home.fields.icon}
          <input
            className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
            defaultValue={room?.ikona ?? ""}
            name="ikona"
          />
        </label>
        <label className="block text-sm font-medium">
          {t.modules.home.fields.order}
          <input
            className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
            defaultValue={room?.[orderColumn]}
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
          defaultValue={room?.opis ?? ""}
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
