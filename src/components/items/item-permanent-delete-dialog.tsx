"use client";

import { useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { deleteItemPermanentlyFromDialog } from "@/app/(app)/items/actions";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { PermanentItemDeletionActionResult } from "@/lib/items/permanent-item-deletion";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";

type ItemPermanentDeleteDialogProps = {
  itemId: string;
  itemName: string;
};

export function ItemPermanentDeleteDialog({
  itemId,
  itemName,
}: ItemPermanentDeleteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isSubmittingRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const copy = t.modules.items.itemDelete;

  function showSuccessStatus() {
    const params = new URLSearchParams(window.location.search);
    params.delete("error");
    params.set("status", "item_deleted");
    router.replace(`${pathname}?${params.toString()}`);
    router.refresh();
  }

  function openDialog() {
    setMessage(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    if (!isSubmittingRef.current) {
      dialogRef.current?.close();
    }
  }

  function resetAfterClose() {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    setMessage(null);
    triggerRef.current?.focus();
  }

  function errorMessage(result: PermanentItemDeletionActionResult) {
    if (result.ok) {
      return null;
    }

    if (result.code === "item_has_files") {
      return t.modules.items.errors.itemHasFiles;
    }

    if (result.code === "item_not_available") {
      return t.modules.items.errors.itemNotAvailable;
    }

    if (result.code === "admin_required") {
      return t.modules.items.errors.adminRequired;
    }

    if (result.code === "active_profile_required") {
      return t.modules.items.errors.activeProfileRequired;
    }

    if (result.code === "invalid_item_id") {
      return t.modules.items.errors.invalidItemId;
    }

    return copy.error;
  }

  async function submitDelete() {
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await deleteItemPermanentlyFromDialog({ itemId });

      if (!result.ok) {
        setMessage(errorMessage(result));
        return;
      }

      dialogRef.current?.close();
      showSuccessStatus();
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
          className: "w-full gap-2 sm:w-auto",
          variant: "danger",
        })}
        onClick={openDialog}
        ref={triggerRef}
        type="button"
      >
        <TrashIcon aria-hidden="true" size={18} weight="bold" />
        {t.modules.items.deleteItem}
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
        <div
          aria-busy={isSubmitting}
          className="max-h-[calc(100vh-2rem)] space-y-5 overflow-y-auto p-4 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold" id={titleId}>
                {copy.title}
              </h2>
              <p className="mt-1 break-words text-sm text-muted" id={descriptionId}>
                {itemName}
              </p>
            </div>
            <Button disabled={isSubmitting} onClick={closeDialog} variant="ghost">
              {copy.cancel}
            </Button>
          </div>

          {message ? <Alert variant="danger">{message}</Alert> : null}

          <Alert variant="warning">
            {copy.description.replace("{name}", itemName)}
          </Alert>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              disabled={isSubmitting}
              onClick={closeDialog}
              variant="secondary"
            >
              {copy.cancel}
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={() => void submitDelete()}
              variant="danger"
            >
              <TrashIcon aria-hidden="true" size={18} weight="bold" />
              {isSubmitting ? copy.pending : copy.confirm}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
