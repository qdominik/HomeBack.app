"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { copyFurniture } from "@/app/(app)/home/actions";
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

type CopyFurnitureDialogProps = {
  furnitureId: string;
  furnitureName: string;
  initialRoomId: string;
  rooms: RoomOption[];
  storageCount: number;
};

export function CopyFurnitureDialog({
  furnitureId,
  furnitureName,
  initialRoomId,
  rooms,
  storageCount,
}: CopyFurnitureDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isSubmittingRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => defaultCopyName(furnitureName));
  const [targetRoomId, setTargetRoomId] = useState(initialRoomId);
  const [copyStorage, setCopyStorage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const copy = t.modules.copy;

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
    setName(defaultCopyName(furnitureName));
    setTargetRoomId(initialRoomId);
    setCopyStorage(true);
  }

  function showSuccessStatus() {
    const params = new URLSearchParams(window.location.search);
    params.delete("error");
    params.set("status", "furniture_copied");
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
      const result = await copyFurniture({
        copyStorage,
        furnitureId,
        name,
        targetRoomId,
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
        {copy.furniture.action}
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
                {copy.furniture.title}
              </h2>
              <p
                className="mt-1 break-words text-sm text-muted"
                id={descriptionId}
              >
                {furnitureName}
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
            {copy.furniture.targetRoom}
            <select
              className="ui-control mt-2 w-full"
              disabled={isSubmitting}
              onChange={(event) => setTargetRoomId(event.currentTarget.value)}
              required
              value={targetRoomId}
            >
              <option value="">{copy.furniture.targetRoom}</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.label}
                </option>
              ))}
            </select>
          </label>

          <dl className="rounded-control border border-line bg-surface-muted p-3">
            <dt className="text-sm text-muted">{copy.furniture.storageCount}</dt>
            <dd className="mt-1 text-lg font-semibold">{storageCount}</dd>
          </dl>

          <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line p-4 focus-within:ring-2 focus-within:ring-primary">
            <input
              checked={copyStorage}
              disabled={isSubmitting}
              onChange={(event) => setCopyStorage(event.currentTarget.checked)}
              type="checkbox"
            />
            <span className="font-semibold">{copy.furniture.copyStorage}</span>
          </label>
          <Alert variant="warning">{copy.furniture.itemsExcluded}</Alert>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button disabled={isSubmitting} onClick={closeDialog} variant="secondary">
              {copy.cancel}
            </Button>
            <Button
              disabled={isSubmitting || !name.trim() || !targetRoomId}
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
