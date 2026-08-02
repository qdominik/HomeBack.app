"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { copyRoom } from "@/app/(app)/home/actions";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  defaultCopyName,
  resolveCopyDialogOutcome,
} from "@/lib/copy-entities/copy-contract";
import { t } from "@/lib/i18n";

type CopyRoomDialogProps = {
  furnitureCount: number;
  roomId: string;
  roomName: string;
  storageCount: number;
};

export function CopyRoomDialog({
  furnitureCount,
  roomId,
  roomName,
  storageCount,
}: CopyRoomDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isSubmittingRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => defaultCopyName(roomName));
  const [copyStructure, setCopyStructure] = useState(true);
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
    setName(defaultCopyName(roomName));
    setCopyStructure(true);
  }

  function showSuccessStatus() {
    const params = new URLSearchParams(window.location.search);
    params.delete("error");
    params.set("status", "room_copied");
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
      const result = await copyRoom({ copyStructure, name, roomId });
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
        {copy.room.action}
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
                {copy.room.title}
              </h2>
              <p
                className="mt-1 break-words text-sm text-muted"
                id={descriptionId}
              >
                {roomName}
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

          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-control border border-line bg-surface-muted p-3">
              <dt className="text-sm text-muted">{copy.room.furnitureCount}</dt>
              <dd className="mt-1 text-lg font-semibold">{furnitureCount}</dd>
            </div>
            <div className="rounded-control border border-line bg-surface-muted p-3">
              <dt className="text-sm text-muted">{copy.room.storageCount}</dt>
              <dd className="mt-1 text-lg font-semibold">{storageCount}</dd>
            </div>
          </dl>

          <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line p-4 focus-within:ring-2 focus-within:ring-primary">
            <input
              checked={copyStructure}
              disabled={isSubmitting}
              onChange={(event) => setCopyStructure(event.currentTarget.checked)}
              type="checkbox"
            />
            <span className="font-semibold">{copy.room.copyStructure}</span>
          </label>
          <Alert variant="warning">{copy.room.itemsExcluded}</Alert>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button disabled={isSubmitting} onClick={closeDialog} variant="secondary">
              {copy.cancel}
            </Button>
            <Button disabled={isSubmitting || !name.trim()} type="submit">
              {isSubmitting ? copy.loading : copy.create}
            </Button>
          </div>
        </form>
        </dialog>
      </ModalPortal>
    </>
  );
}
