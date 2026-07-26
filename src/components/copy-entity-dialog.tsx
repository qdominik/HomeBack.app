"use client";

import { useRef, useState } from "react";
import { CopyIcon } from "@phosphor-icons/react/dist/ssr/Copy";
import { buttonClassName } from "@/components/ui/button";
import { defaultCopyName } from "@/lib/home/copy-entities";
import { t } from "@/lib/i18n";

type Option = { id: string; label: string };
type Action = (input: never) => Promise<{ ok: boolean; id?: string; code?: string }>;

export function CopyEntityDialog({
  kind,
  sourceId,
  sourceName,
  action,
  targetId,
  targetOptions = [],
  targetLabel,
  structureCount = 0,
}: {
  kind: "room" | "furniture" | "storage" | "item";
  sourceId: string;
  sourceName: string;
  action: Action;
  targetId?: string | null;
  targetOptions?: Option[];
  targetLabel?: string;
  structureCount?: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(defaultCopyName(sourceName));
  const [copyChildren, setCopyChildren] = useState(kind === "room" || kind === "furniture");
  const [selectedTarget, setSelectedTarget] = useState(targetId ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open() {
    setName(defaultCopyName(sourceName));
    setSelectedTarget(targetId ?? "");
    setError(null);
    dialogRef.current?.showModal();
  }

  async function submit() {
    setPending(true);
    setError(null);
    const payload: Record<string, unknown> = { name };
    if (kind === "room") Object.assign(payload, { roomId: sourceId, copyStructure: copyChildren });
    if (kind === "furniture") Object.assign(payload, { storageId: sourceId, targetRoomId: selectedTarget, copyStorage: copyChildren });
    if (kind === "storage") Object.assign(payload, { storageId: sourceId, targetFurnitureId: selectedTarget });
    if (kind === "item") Object.assign(payload, { itemId: sourceId, targetStorageLocationL3Id: selectedTarget || null });
    const result = await action(payload as never);
    setPending(false);
    if (!result.ok) {
      setError(t.copy.error);
      return;
    }
    dialogRef.current?.close();
    window.location.reload();
  }

  return (
    <>
      <button className={buttonClassName({ variant: "secondary" })} onClick={open} type="button">
        <CopyIcon aria-hidden="true" size={18} /> Kopiuj
      </button>
      <dialog className="w-[min(92vw,34rem)] rounded-lg border border-line bg-surface p-0 text-foreground shadow-xl" ref={dialogRef}>
        <div className="space-y-5 p-5 sm:p-6">
          <div><h2 className="text-xl font-semibold">{t.copy.title.replace("{name}", sourceName)}</h2><p className="mt-1 text-sm text-muted">{t.copy.description}</p></div>
          <label className="grid gap-2 text-sm font-medium">{t.copy.name}<input className="rounded-md border border-line bg-surface px-3 py-2" onChange={(event) => setName(event.target.value)} value={name} /></label>
          {kind === "room" || kind === "furniture" ? <label className="flex items-center gap-2 text-sm"><input checked={copyChildren} onChange={(event) => setCopyChildren(event.target.checked)} type="checkbox" />{kind === "room" ? t.copy.copyStructure : t.copy.copyStorage} ({structureCount})</label> : null}
          {kind !== "room" && targetOptions.length ? <label className="grid gap-2 text-sm font-medium">{targetLabel ?? t.copy.target}<select className="rounded-md border border-line bg-surface px-3 py-2" onChange={(event) => setSelectedTarget(event.target.value)} value={selectedTarget}><option value="">Wybierz</option>{targetOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label> : null}
          {kind === "item" ? <p className="text-sm text-muted">{t.copy.unlocated}</p> : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end gap-3"><button className={buttonClassName({ variant: "ghost" })} onClick={() => dialogRef.current?.close()} type="button">{t.copy.cancel}</button><button className={buttonClassName({ variant: "primary" })} disabled={pending || !name.trim()} onClick={submit} type="button">{pending ? t.copy.pending : t.copy.submit}</button></div>
        </div>
      </dialog>
    </>
  );
}
