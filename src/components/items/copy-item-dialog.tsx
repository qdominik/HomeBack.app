"use client";

import { FormActions } from "@/components/ui/form-actions";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { copyItem } from "@/app/(app)/items/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  defaultCopyName,
  resolveCopyDialogOutcome,
} from "@/lib/copy-entities/copy-contract";
import { t } from "@/lib/i18n";
import { CopyIcon } from "@phosphor-icons/react/dist/ssr/Copy";
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
    getInitialItemLocationSelection(locationOptions, location?.positionName ? location.id : null, location?.storageId, location?.roomId),
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
    setSelection(getInitialItemLocationSelection(locationOptions, location?.positionName ? location.id : null, location?.storageId, location?.roomId));
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
      <Button
        aria-label={copy.item.action}
        onClick={openDialog}
        ref={triggerRef}
        size="icon"
        type="button"
        variant="secondary"
      >
        <CopyIcon aria-hidden="true" size={18} />
      </Button>
      <ModalPortal>
        <Dialog
          aria-describedby={descriptionId}
          aria-labelledby={titleId}

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
          className="ui-dialog-body space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submitCopy();
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="ui-dialog-title" id={titleId}>
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
            <Input
              autoFocus
              className="mt-2 w-full"
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
              <input className="ui-choice"
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
              <Select
                className="mt-2 w-full"
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
              </Select>
            </label>

            <label className="ui-label block">
              {copy.item.targetFurniture}
              <Select
                className="mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
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
              </Select>
            </label>

            <label className="ui-label block">
              {copy.item.targetStorage}
              <Select
                className="mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
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
              </Select>
            </label>
          </fieldset>

          <FormActions className="ui-dialog-actions">
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
          </FormActions>
        </form>
        </Dialog>
      </ModalPortal>
    </>
  );
}
