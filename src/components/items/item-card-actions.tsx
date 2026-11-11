"use client";

import { PencilSimpleLineIcon } from "@phosphor-icons/react/PencilSimpleLine";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

type ItemCardActionsProps = {
  actions: ReactNode;
  date: ReactNode;
  editForm: ReactNode;
};

export function ItemCardActions({ actions, date, editForm }: ItemCardActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editId = useId();

  return (
    <div className="@container mt-3 border-t border-line pt-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs leading-5 text-muted">{date}</p>
        <div className="ui-item-card-actions flex max-w-full flex-wrap items-center gap-2">
          {editForm ? (
            <Button
              aria-controls={editId}
              aria-expanded={isEditing}
              className="@max-[19rem]:w-11 @max-[19rem]:px-0"
              onClick={() => setIsEditing((previous) => !previous)}
              variant="secondary"
            >
              <PencilSimpleLineIcon aria-hidden="true" size={18} />
              <span className="@max-[19rem]:sr-only">{t.modules.items.editItem}</span>
            </Button>
          ) : null}
          {actions}
        </div>
      </div>
      {editForm ? (
        <div
          className="mt-3 rounded-md border border-line bg-surface-muted p-3 sm:p-4"
          hidden={!isEditing}
          id={editId}
        >
          {editForm}
        </div>
      ) : null}
    </div>
  );
}
