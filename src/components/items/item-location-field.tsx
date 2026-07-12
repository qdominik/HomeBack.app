"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import {
  getInitialItemLocationSelection,
  getPositionOptionsForStorage,
  getStorageOptionsForRoom,
  selectItemLocationRoom,
  selectItemLocationStorage,
  type ItemLocationSelectorOptions,
} from "@/lib/items/item-options";

type ItemLocationFieldProps = {
  options: ItemLocationSelectorOptions;
  selectedPositionId?: string | null;
};

export function ItemLocationField({
  options,
  selectedPositionId,
}: ItemLocationFieldProps) {
  const [selection, setSelection] = useState(() =>
    getInitialItemLocationSelection(options, selectedPositionId),
  );

  const storageOptions = getStorageOptionsForRoom(options, selection.roomId);
  const positionOptions = getPositionOptionsForStorage(
    options,
    selection.storageId,
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
            setSelection(selectItemLocationRoom(event.currentTarget.value));
          }}
          value={selection.roomId}
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
          disabled={!selection.roomId || storageOptions.length === 0}
          name="storage_location_l2_id"
          onChange={(event) => {
            const storageId = event.currentTarget.value;

            setSelection((currentSelection) =>
              selectItemLocationStorage(currentSelection, storageId),
            );
          }}
          value={selection.storageId}
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
          disabled={!selection.storageId || positionOptions.length === 0}
          name="storage_location_l3_id"
          onChange={(event) => {
            const positionId = event.currentTarget.value;

            setSelection((currentSelection) => ({
              ...currentSelection,
              positionId,
            }));
          }}
          value={selection.positionId}
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
