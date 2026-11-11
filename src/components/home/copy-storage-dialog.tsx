"use client";

import { FormActions } from "@/components/ui/form-actions";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { copyStorageSpace } from "@/app/(app)/home/actions";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  defaultCopyName,
  resolveCopyDialogOutcome,
} from "@/lib/copy-entities/copy-contract";
import { t } from "@/lib/i18n";

type RoomOption = {
  id: string;
  label: string;
};

type FurnitureOption = {
  id: string;
  label: string;
  roomId: string;
};

type CopyStorageDialogProps = {
  furniture: FurnitureOption[];
  initialFurnitureId: string;
  initialRoomId: string;
  rooms: RoomOption[];
  storageId: string;
  storageName: string;
};

export function CopyStorageDialog({
  furniture,
  initialFurnitureId,
  initialRoomId,
  rooms,
  storageId,
  storageName,
}: CopyStorageDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isSubmittingRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => defaultCopyName(storageName));
  const [targetRoomId, setTargetRoomId] = useState(initialRoomId);
  const [targetFurnitureId, setTargetFurnitureId] =
    useState(initialFurnitureId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const copy = t.modules.copy;
  const furnitureOptions = furniture.filter(
    (option) => option.roomId === targetRoomId,
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
    setName(defaultCopyName(storageName));
    setTargetRoomId(initialRoomId);
    setTargetFurnitureId(initialFurnitureId);
  }

  function showSuccessStatus() {
    const params = new URLSearchParams(window.location.search);
    params.delete("error");
    params.set("status", "storage_copied");
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
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await copyStorageSpace({
        name,
        storageId,
        targetFurnitureId,
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
        {copy.storage.action}
      </button>
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
                {copy.storage.title}
              </h2>
              <p
                className="mt-1 break-words text-sm text-muted"
                id={descriptionId}
              >
                {storageName}
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
              onChange={(event) => setName(event.currentTarget.value)}
              required
              value={name}
            />
          </label>

          <label className="ui-label block">
            {copy.storage.targetRoom}
            <Select
              className="mt-2 w-full"
              disabled={isSubmitting}
              onChange={(event) => {
                setTargetRoomId(event.currentTarget.value);
                setTargetFurnitureId("");
              }}
              required
              value={targetRoomId}
            >
              <option value="">{copy.storage.targetRoom}</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="ui-label block">
            {copy.storage.targetFurniture}
            <Select
              className="mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !targetRoomId || !furnitureOptions.length}
              onChange={(event) => setTargetFurnitureId(event.currentTarget.value)}
              required
              value={targetFurnitureId}
            >
              <option value="">{copy.storage.targetFurniture}</option>
              {furnitureOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>

          <Alert variant="warning">{copy.storage.itemsExcluded}</Alert>

          <FormActions className="ui-dialog-actions">
            <Button disabled={isSubmitting} onClick={closeDialog} variant="secondary">
              {copy.cancel}
            </Button>
            <Button
              disabled={isSubmitting || !name.trim() || !targetFurnitureId}
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
