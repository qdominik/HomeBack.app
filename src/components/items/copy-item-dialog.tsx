"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { copyItem } from "@/app/(app)/items/actions";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  defaultCopyName,
  resolveCopyDialogOutcome,
} from "@/lib/copy-entities/copy-contract";
import { t } from "@/lib/i18n";
import {
  getInitialItemLocationSelection,
  getPositionOptionsForStorage,
  getStorageOptionsForRoom,
  selectItemLocationRoom,
  selectItemLocationStorage,
  type ItemLocationOption,
  type ItemLocationSelectorOptions,
} from "@/lib/items/item-options";

type CopyItemDialogProps = {
  itemId: string;
  itemName: string;
  location: ItemLocationOption | null;
  locationOptions: ItemLocationSelectorOptions;
};

export function CopyItemDialog({
  itemId,
  itemName,
  location,
  locationOptions,
}: CopyItemDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isSubmittingRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => defaultCopyName(itemName));
  const [selection, setSelection] = useState(() =>
    getInitialItemLocationSelection(locationOptions, location?.id),
  );
  const [withoutLocation, setWithoutLocation] = useState(!location);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const copy = t.modules.copy;
  const furnitureOptions = getStorageOptionsForRoom(
    locationOptions,
    selection.roomId,
  );
  const storageOptions = getPositionOptionsForStorage(
    locationOptions,
    selection.storageId,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function resetForm() {
    setName(defaultCopyName(itemName));
    setSelection(getInitialItemLocationSelection(locationOptions, location?.id));
    setWithoutLocation(!location);
  }

  function showSuccessStatus() {
    const params = new URLSearchParams(window.location.search);
    params.delete("error");
    params.set("status", "item_copied");
    router.replace(`${pathname}?${params.toString()}`);
    router.refresh();
  }

  function openDialog() {
    resetForm();
    setMessage(null);
    setOpen(true);
  }

  function closeDialog() {
    if (!isSubmittingRef.current) {
      setOpen(false);
    }
  }

  function resetAfterClose() {
    setOpen(false);
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    setMessage(null);
    resetForm();
    triggerRef.current?.focus();
  }

  async function submitCopy() {
    if (isSubmittingRef.current || (!withoutLocation && !selection.positionId)) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await copyItem({
        itemId,
        name,
        targetStorageId: withoutLocation ? null : selection.positionId,
      });
      const outcome = resolveCopyDialogOutcome(result, copy.error);

      if (!result.ok) {
        setMessage(outcome.errorMessage);
        return;
      }

      if (outcome.resetForm) resetForm();
      if (outcome.clearError) setMessage(null);
      if (outcome.closeDialog) setOpen(false);
      if (outcome.refresh) showSuccessStatus();
    } catch {
      setMessage(copy.error);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        className={buttonClassName({
          className: "self-start",
          variant: "secondary",
        })}
        onClick={openDialog}
        ref={triggerRef}
        type="button"
      >
        {copy.item.action}
      </button>
      <ModalPortal>
        <dialog
          aria-describedby={descriptionId}
          aria-labelledby={titleId}
          className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-card border border-line bg-surface p-0 text-foreground shadow-card backdrop:bg-foreground/40"
          onCancel={(event) => {
          if (isSubmittingRef.current) {
            event.preventDefault();
          }
        }}
          onClose={resetAfterClose}
          ref={dialogRef}
      >
        <form
          aria-busy={isSubmitting}
          className="max-h-[calc(100vh-2rem)] space-y-5 overflow-y-auto p-4 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            void submitCopy();
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold" id={titleId}>
                {copy.item.title}
              </h2>
              <p
                className="mt-1 break-words text-sm text-muted"
                id={descriptionId}
              >
                {itemName}
              </p>
            </div>
            <Button disabled={isSubmitting} onClick={closeDialog} variant="ghost">
              {copy.cancel}
            </Button>
          </div>

          {message ? <Alert variant="danger">{message}</Alert> : null}

          <label className="ui-label block">
            {copy.copyName}
            <input
              autoFocus
              className="ui-control mt-2 w-full"
              disabled={isSubmitting}
              onChange={(event) => {
                const nextName = event.currentTarget.value;
                setName(nextName);
              }}
              required
              value={name}
            />
          </label>

          <fieldset className="space-y-3">
            <legend className="ui-label">{copy.item.targetStorage}</legend>
            <label className="flex cursor-pointer items-center gap-3 rounded-control border border-line p-3 focus-within:ring-2 focus-within:ring-primary">
              <input
                checked={withoutLocation}
                disabled={isSubmitting}
                name={"copy-item-location-" + itemId}
                onChange={() => {
                  setWithoutLocation(true);
                  setSelection(selectItemLocationRoom(""));
                }}
                type="radio"
              />
              <span>{copy.noLocation}</span>
            </label>

            <label className="ui-label block">
              {copy.item.targetRoom}
              <select
                className="ui-control mt-2 w-full"
                disabled={isSubmitting}
                onChange={(event) => {
                  const roomId = event.currentTarget.value;
                  setWithoutLocation(false);
                  setSelection(selectItemLocationRoom(roomId));
                }}
                value={selection.roomId}
              >
                <option value="">{t.modules.items.selectRoom}</option>
                {locationOptions.rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ui-label block">
              {copy.item.targetFurniture}
              <select
                className="ui-control mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  isSubmitting || !selection.roomId || !furnitureOptions.length
                }
                onChange={(event) => {
                  const storageId = event.currentTarget.value;
                  setWithoutLocation(false);
                  setSelection((currentSelection) =>
                    selectItemLocationStorage(currentSelection, storageId),
                  );
                }}
                value={selection.storageId}
              >
                <option value="">{t.modules.items.selectStorage}</option>
                {furnitureOptions.map((furniture) => (
                  <option key={furniture.id} value={furniture.id}>
                    {furniture.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ui-label block">
              {copy.item.targetStorage}
              <select
                className="ui-control mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  isSubmitting || !selection.storageId || !storageOptions.length
                }
                onChange={(event) => {
                  const positionId = event.currentTarget.value;
                  setWithoutLocation(false);
                  setSelection((currentSelection) => ({
                    ...currentSelection,
                    positionId,
                  }));
                }}
                value={selection.positionId}
              >
                <option value="">{t.modules.items.selectPosition}</option>
                {storageOptions.map((storage) => (
                  <option key={storage.id} value={storage.id}>
                    {storage.positionName}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button disabled={isSubmitting} onClick={closeDialog} variant="secondary">
              {copy.cancel}
            </Button>
            <Button
              disabled={
                isSubmitting ||
                !name.trim() ||
                (!withoutLocation && !selection.positionId)
              }
              type="submit"
            >
              {isSubmitting ? copy.loading : copy.create}
            </Button>
          </div>
        </form>
        </dialog>
      </ModalPortal>
    </>
  );
}
