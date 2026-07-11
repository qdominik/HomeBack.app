"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { ItemLocationSelectorOptions } from "@/lib/items/item-options";

type ItemLocationFieldProps = {
  options: ItemLocationSelectorOptions;
  selectedPositionId?: string | null;
};

export function ItemLocationField({
  options,
  selectedPositionId,
}: ItemLocationFieldProps) {
  const initialOption =
    options.positions.find((option) => option.id === selectedPositionId) ?? null;
  const [roomId, setRoomId] = useState(initialOption?.roomId ?? "");
  const [storageId, setStorageId] = useState(initialOption?.storageId ?? "");
  const [positionId, setPositionId] = useState(initialOption?.id ?? "");

  const storageOptions = options.storageLocations.filter(
    (option) => option.roomId === roomId,
  );
  const positionOptions = options.positions.filter(
    (option) => option.storageId === storageId,
  );

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{t.modules.items.location}</legend>
      <label className="block text-sm font-medium">
        {t.modules.items.room}
        <select
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
          name="room_id"
          onChange={(event) => {
            setRoomId(event.currentTarget.value);
            setStorageId("");
            setPositionId("");
          }}
          value={roomId}
        >
          <option value="">{t.modules.items.selectRoom}</option>
          {options.rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        {t.modules.items.storage}
        <select
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!roomId}
          name="storage_location_l2_id"
          onChange={(event) => {
            setStorageId(event.currentTarget.value);
            setPositionId("");
          }}
          value={storageId}
        >
          <option value="">{t.modules.items.selectStorage}</option>
          {storageOptions.map((storage) => (
            <option key={storage.id} value={storage.id}>
              {storage.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        {t.modules.items.position}
        <select
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!storageId}
          name="storage_location_l3_id"
          onChange={(event) => setPositionId(event.currentTarget.value)}
          value={positionId}
        >
          <option value="">{t.modules.items.selectPosition}</option>
          {positionOptions.map((position) => (
            <option key={position.id} value={position.id}>
              {position.positionName}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-muted">{t.modules.items.locationHelp}</p>
    </fieldset>
  );
}
