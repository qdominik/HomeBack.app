"use client";

import { useState } from "react";
import { restoreItem } from "@/app/(app)/items/actions";
import { buttonClassName } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import {
  restorableItemStatuses,
  type RestorableItemStatus,
} from "@/lib/items/item-archive-restore";
import { ItemSubmitButton } from "./item-submit-button";

const statusLabels: Record<RestorableItemStatus, string> = {
  "w domu": t.modules.items.statuses.atHome,
  "pożyczone": t.modules.items.statuses.borrowed,
  "zużyte": t.modules.items.statuses.consumed,
};

type LegacyItemRestoreFormProps = {
  itemId: string;
};

export function LegacyItemRestoreForm({
  itemId,
}: LegacyItemRestoreFormProps) {
  const [targetStatus, setTargetStatus] = useState("");

  return (
    <form action={restoreItem} className="flex flex-wrap items-end gap-2">
      <input name="item_id" type="hidden" value={itemId} />
      <label className="min-w-44 flex-1 text-sm font-medium sm:flex-none">
        {t.modules.items.restoreAs}
        <select
          className="mt-1 h-11 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
          name="legacy_target_status"
          onChange={(event) => setTargetStatus(event.currentTarget.value)}
          required
          value={targetStatus}
        >
          <option value="">{t.modules.items.selectRestoreStatus}</option>
          {restorableItemStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <ItemSubmitButton
        className={buttonClassName({
          className: "w-full sm:w-auto",
          variant: "secondary",
        })}
        disabled={!targetStatus}
        icon="restore"
        label={t.modules.items.restoreItem}
        pendingLabel={t.modules.items.restoring}
      />
      <p className="w-full text-xs text-muted">
        {t.modules.items.previousStatusUnavailable}
      </p>
    </form>
  );
}
