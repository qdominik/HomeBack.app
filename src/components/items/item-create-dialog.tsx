"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { t } from "@/lib/i18n";
import { routes } from "@/lib/routes";

// Only the modal shell: ItemForm and its server action stay owned by the Items page.
export function ItemCreateDialog({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLInputElement>('input[name="nazwa"]')?.focus();
  }, []);

  return (
    <dialog
      aria-labelledby="add-item-title"
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-control border border-line bg-surface p-3 text-foreground shadow-card backdrop:bg-black/40 sm:p-5"
      onClose={() => {
        router.replace(routes.items, { scroll: false });
        document.getElementById("add-item-trigger")?.focus();
      }}
      ref={dialog}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold" id="add-item-title">{t.dashboard.addItem}</h2>
        <button
          aria-label={t.navigation.closeAddItem}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-control border border-line hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary"
          onClick={() => dialog.current?.close()}
          type="button"
        >
          <XIcon aria-hidden="true" size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
