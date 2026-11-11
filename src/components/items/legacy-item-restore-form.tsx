"use client";

import { Select } from "@/components/ui/select";
import { useState } from "react";
import { restoreItem } from "@/app/(app)/items/actions";
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
        <Select
          className="mt-2"
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
        </Select>
      </label>
      <ItemSubmitButton
        disabled={!targetStatus}
        icon="restore"
        label={t.modules.items.restoreItem}
        pendingLabel={t.modules.items.restoring}
        variant="secondary"
      />
      <p className="w-full text-xs text-muted">
        {t.modules.items.previousStatusUnavailable}
      </p>
    </form>
  );
}
