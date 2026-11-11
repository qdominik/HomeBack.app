"use client";

import { Select } from "@/components/ui/select";
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
  selectedStorageId?: string | null;
  selectedRoomId?: string | null;
};

export function ItemLocationField({
  options,
  selectedPositionId,
  selectedStorageId,
  selectedRoomId,
}: ItemLocationFieldProps) {
  const [selection, setSelection] = useState(() =>
    getInitialItemLocationSelection(options, selectedPositionId, selectedStorageId, selectedRoomId),
  );

  const storageOptions = getStorageOptionsForRoom(options, selection.roomId);
  const positionOptions = getPositionOptionsForStorage(
    options,
    selection.storageId,
  );

  return (
    <fieldset className="min-w-0 max-w-full space-y-3">
      <legend className="text-sm font-medium">{t.modules.items.location}</legend>
      <label className="ui-label min-w-0 max-w-full">
        {t.modules.items.room}
        <Select
          className="mt-2"
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
        </Select>
      </label>
      <label className="ui-label min-w-0 max-w-full">
        {t.modules.items.storage}
        <Select
          className="mt-2"
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
        </Select>
      </label>
      <label className="ui-label min-w-0 max-w-full">
        {t.modules.items.position}
        <Select
          className="mt-2"
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
        </Select>
      </label>
      <p className="text-xs text-muted">{t.modules.items.locationHelp}</p>
    </fieldset>
  );
}
