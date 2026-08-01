"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { copyStorageSpace } from "@/app/(app)/home/actions";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
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
        className={buttonClassName({ variant: "secondary" })}
        onClick={openDialog}
        ref={triggerRef}
        type="button"
      >
        {copy.storage.action}
      </button>
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
            <input
              autoFocus
              className="ui-control mt-2 w-full"
              disabled={isSubmitting}
              onChange={(event) => setName(event.currentTarget.value)}
              required
              value={name}
            />
          </label>

          <label className="ui-label block">
            {copy.storage.targetRoom}
            <select
              className="ui-control mt-2 w-full"
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
            </select>
          </label>

          <label className="ui-label block">
            {copy.storage.targetFurniture}
            <select
              className="ui-control mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
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
            </select>
          </label>

          <Alert variant="warning">{copy.storage.itemsExcluded}</Alert>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button disabled={isSubmitting} onClick={closeDialog} variant="secondary">
              {copy.cancel}
            </Button>
            <Button
              disabled={isSubmitting || !name.trim() || !targetFurnitureId}
              type="submit"
            >
              {isSubmitting ? copy.loading : copy.create}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
