"use client";

import { useState } from "react";
import { TemplateOrCustomField } from "@/components/form/template-or-custom-field";
import { Button } from "@/components/ui/button";
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
    <form action={action} className="space-y-4">
      {room ? <input name="room_id" type="hidden" value={room.id} /> : null}
      <label className="ui-label">
        {t.modules.home.fields.name}
        <input
          className="ui-control mt-2"
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
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <label className="ui-label">
          {t.modules.home.fields.icon}
          <input
            className="ui-control mt-2"
            defaultValue={room?.ikona ?? ""}
            name="ikona"
          />
        </label>
        <label className="ui-label">
          {t.modules.home.fields.order}
          <input
            className="ui-control mt-2"
            defaultValue={room?.[orderColumn]}
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
          defaultValue={room?.opis ?? ""}
          name="opis"
        />
      </label>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}