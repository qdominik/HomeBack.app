"use client";

import { useState } from "react";
import { TemplateOrCustomField } from "@/components/form/template-or-custom-field";
import { EntityIconPicker } from "@/components/icons/entity-icon-picker";
import { Button } from "@/components/ui/button";
import { ROOM_TEMPLATE_OPTIONS } from "@/lib/home/home-template-options";
import { inferHomeKind } from "@/lib/home/infer-home-kind";
import {
  getDefaultRoomIconKey,
  normalizeEntityIconKey,
} from "@/lib/icons/entity-icon-validation";
import { resolveRoomIconKey } from "@/lib/icons/room-icon-suggestion";
import { t } from "@/lib/i18n";
import type { Room } from "./home-types";

type RoomFormProps = {
  action: (formData: FormData) => Promise<void>;
  room?: Room;
  submitLabel: string;
};

const orderColumn = "kolejno\u015b\u0107" as const;

export function RoomForm({ action, room, submitLabel }: RoomFormProps) {
  const [inferredKind, setInferredKind] = useState<string | null>(null);
  const [roomName, setRoomName] = useState(room?.nazwa ?? "");
  const [iconKey, setIconKey] = useState(() =>
    room
      ? normalizeEntityIconKey(room.ikona, "room")
      : getDefaultRoomIconKey(),
  );
  const [iconSelectionMode, setIconSelectionMode] = useState<
    "automatic" | "manual"
  >(room ? "manual" : "automatic");

  function updateAutomaticIcon(name: string, kind?: string | null) {
    if (room || iconSelectionMode === "manual") {
      return;
    }

    setIconKey(
      resolveRoomIconKey({
        currentIconKey: iconKey,
        kind,
        name,
        selectionMode: iconSelectionMode,
      }),
    );
  }

  function handleNameChange(value: string) {
    setRoomName(value);

    if (room) {
      return;
    }

    const nextKind = inferHomeKind(value, "room");
    setInferredKind(nextKind);
    updateAutomaticIcon(value, nextKind);
  }

  function handleKindChange(value: string) {
    updateAutomaticIcon(roomName, value);
  }

  return (
    <form action={action} className="space-y-4">
      {room ? <input name="room_id" type="hidden" value={room.id} /> : null}
      <label className="ui-label">
        {t.modules.home.fields.roomName}
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
        label={t.modules.home.fields.roomType}
        name="typ"
        onChange={handleKindChange}
        templateOptions={ROOM_TEMPLATE_OPTIONS}
      />
      <EntityIconPicker
        group="room"
        label={t.modules.home.fields.icon}
        name="ikona"
        onValueChange={(value) => {
          setIconKey(value);
          setIconSelectionMode("manual");
        }}
        value={iconKey}
      />
      <label className="ui-label sm:max-w-32">
        {t.modules.home.fields.order}
        <input
          className="ui-control mt-2"
          defaultValue={room?.[orderColumn]}
          min="0"
          name="kolejnosc"
          type="number"
        />
      </label>
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