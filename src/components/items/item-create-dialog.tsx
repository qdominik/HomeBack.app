"use client";

import { Dialog } from "@/components/ui/dialog";
import { useLayoutEffect, useRef, useState } from "react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { createItem } from "@/app/(app)/items/actions";
import { ItemForm } from "@/components/items/item-form";
import type { ItemCreateOptions } from "@/lib/server/item-create-options";
import { t } from "@/lib/i18n";

export function ItemCreateDialog({ options }: { options: ItemCreateOptions }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLInputElement>('input[name="nazwa"]')?.focus();
  }, [open]);

  return <>
    <button
      aria-label={t.dashboard.addItem}
      title={t.dashboard.addItem}
      aria-haspopup="dialog"
      aria-controls="add-item-dialog"
      id="add-item-trigger"
      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-control border border-primary bg-primary text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      onClick={() => setOpen(true)}
      ref={trigger}
      type="button"
    ><PlusIcon aria-hidden="true" size={22} weight="bold" /></button>
    <Dialog
      aria-labelledby="add-item-title"
      id="add-item-dialog"
      size="large" className="ui-dialog-body"
      onClose={() => { setOpen(false); trigger.current?.focus(); }}
      ref={dialog}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="ui-dialog-title" id="add-item-title">{t.dashboard.addItem}</h2>
        <button aria-label={t.navigation.closeAddItem} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-control border border-line hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary" onClick={() => dialog.current?.close()} type="button">
          <XIcon aria-hidden="true" size={22} />
        </button>
      </div>
      {open ? <ItemForm
        {...options}
        action={async formData => {
          await createItem(formData);
          dialog.current?.close();
        }}
        submitLabel={t.modules.items.createItem}
      /> : null}
    </Dialog>
  </>;
}
