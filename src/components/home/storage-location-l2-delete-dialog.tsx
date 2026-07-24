"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteStorageLocationL2WithResolution,
  getStorageLocationL2DeletionContext,
} from "@/app/(app)/home/actions";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
import {
  canSubmitStorageLocationL2Delete,
  type StorageLocationL2DeleteResolution,
} from "@/lib/home/storage-location-l2-delete-resolution";
import { t } from "@/lib/i18n";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";

type LoadedContext = Extract<
  Awaited<ReturnType<typeof getStorageLocationL2DeletionContext>>,
  { ok: true }
>["context"];

type StorageLocationL2DeleteDialogProps = {
  storageLocationL2Id: string;
  storageLocationL2Name: string;
};

export function StorageLocationL2DeleteDialog({
  storageLocationL2Id,
  storageLocationL2Name,
}: StorageLocationL2DeleteDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [context, setContext] = useState<LoadedContext | null>(null);
  const [resolution, setResolution] =
    useState<StorageLocationL2DeleteResolution | null>(null);
  const [targetPositionId, setTargetPositionId] = useState<string | null>(null);
  const [step, setStep] = useState<"choose" | "confirm">("choose");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const copy = t.modules.home.furnitureDelete;

  async function loadContext() {
    setIsLoading(true);
    setMessage(null);
    setIsStale(false);
    setContext(null);
    setResolution(null);
    setTargetPositionId(null);
    setStep("choose");

    const result = await getStorageLocationL2DeletionContext(
      storageLocationL2Id,
    );

    if (!result.ok) {
      setMessage(copy.error);
      setIsLoading(false);
      return;
    }

    setContext(result.context);

    if (result.context.summary.totalLocationLinksCount === 0) {
      setResolution("delete");
      setStep("confirm");
    }

    setIsLoading(false);
  }

  function openDialog() {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    dialog.showModal();
    void loadContext();
  }

  function closeDialog() {
    if (!isSubmitting) {
      dialogRef.current?.close();
    }
  }

  function resetAfterClose() {
    setContext(null);
    setResolution(null);
    setTargetPositionId(null);
    setStep("choose");
    setMessage(null);
    setIsLoading(false);
    setIsStale(false);
    triggerRef.current?.focus();
  }

  async function submitResolution() {
    if (
      !context ||
      !canSubmitStorageLocationL2Delete(resolution, targetPositionId) ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const result = await deleteStorageLocationL2WithResolution({
      storageLocationL2Id,
      resolution,
      targetPositionId,
      expectedStorageLocationL3Count: context.summary.positionCount,
      expectedDistinctItemCount: context.summary.totalDistinctItemsCount,
      expectedLocationLinkCount: context.summary.totalLocationLinksCount,
    });

    if (!result.ok) {
      setIsSubmitting(false);

      if (result.code === "dependencies_changed") {
        setResolution(null);
        setTargetPositionId(null);
        setStep("choose");
        setIsStale(true);
        setMessage(copy.changed);
        return;
      }

      setMessage(copy.error);
      return;
    }

    setIsSubmitting(false);
    dialogRef.current?.close();
    router.refresh();
  }

  const summary = context?.summary;
  const hasItems = (summary?.totalLocationLinksCount ?? 0) > 0;
  const selectedTarget = context?.targets.find(
    (target) => target.id === targetPositionId,
  );
  const finalLabel =
    resolution === "move"
      ? copy.finalMove
      : resolution === "detach"
        ? copy.finalDetach
        : (summary?.positionCount ?? 0) > 0
          ? copy.finalDeleteSubtree
          : copy.finalDeleteEmpty;
  const operationLabel =
    resolution === "move"
      ? copy.moveOperation
      : resolution === "detach"
        ? copy.detachOperation
        : copy.deleteOperation;

  return (
    <>
      <button
        className={buttonClassName({ variant: "danger" })}
        onClick={openDialog}
        ref={triggerRef}
        type="button"
      >
        <TrashIcon aria-hidden="true" size={18} />
        {t.modules.home.entityActions.delete} {t.modules.home.entityLabels.storage.singular}
      </button>
      <dialog
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-2xl rounded-card border border-line bg-surface p-0 text-foreground shadow-card backdrop:bg-foreground/40"
        onCancel={(event) => {
          if (isSubmitting) {
            event.preventDefault();
          }
        }}
        onClose={resetAfterClose}
        ref={dialogRef}
      >
        <div
          aria-busy={isLoading || isSubmitting}
          className="max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden p-4 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold" id={titleId}>
                {copy.title}
              </h2>
              <p
                className="mt-1 break-words text-sm text-muted"
                id={descriptionId}
              >
                {storageLocationL2Name}
              </p>
            </div>
            <Button disabled={isSubmitting} onClick={closeDialog} variant="ghost">
              {copy.cancel}
            </Button>
          </div>

          <div className="mt-5 space-y-5">
            {message ? <Alert variant="warning">{message}</Alert> : null}

            {isStale ? (
              <Button onClick={() => void loadContext()} variant="secondary">
                <ArrowsClockwiseIcon aria-hidden="true" size={18} />
                {copy.refresh}
              </Button>
            ) : null}

            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted" role="status">
                {copy.loading}
              </p>
            ) : !context ? (
              <div className="space-y-3">
                <Alert variant="danger">{copy.error}</Alert>
                <Button onClick={() => void loadContext()} variant="secondary">
                  {copy.retry}
                </Button>
              </div>
            ) : step === "choose" && hasItems ? (
              <>
                <Alert variant="warning">{copy.containsItems}</Alert>
                <SourcePath context={context} />
                <DependencyCounts context={context} />
                <fieldset className="space-y-3">
                  <legend className="ui-label">{copy.operation}</legend>
                  <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line p-4 focus-within:ring-2 focus-within:ring-primary">
                    <input
                      checked={resolution === "move"}
                      className="mt-1"
                      disabled={context.targets.length === 0 || isStale}
                      name={`furniture-resolution-${storageLocationL2Id}`}
                      onChange={() => {
                        setResolution("move");
                        setTargetPositionId(null);
                      }}
                      type="radio"
                    />
                    <span className="font-semibold">{copy.moveItems}</span>
                  </label>
                  {context.targets.length === 0 ? (
                    <p className="text-sm text-muted">{copy.noTarget}</p>
                  ) : null}
                  {resolution === "move" && context.targets.length > 0 ? (
                    <label className="ui-label block">
                      {copy.chooseTarget}
                      <select
                        className="ui-control mt-2 w-full"
                        onChange={(event) =>
                          setTargetPositionId(event.currentTarget.value || null)
                        }
                        value={targetPositionId ?? ""}
                      >
                        <option value="">{copy.chooseTarget}</option>
                        {context.targets.map((target) => (
                          <option key={target.id} value={target.id}>
                            {target.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line p-4 focus-within:ring-2 focus-within:ring-primary">
                    <input
                      checked={resolution === "detach"}
                      className="mt-1"
                      disabled={isStale}
                      name={`furniture-resolution-${storageLocationL2Id}`}
                      onChange={() => {
                        setResolution("detach");
                        setTargetPositionId(null);
                      }}
                      type="radio"
                    />
                    <span className="font-semibold">{copy.detachItems}</span>
                  </label>
                </fieldset>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button onClick={closeDialog} variant="secondary">
                    {copy.cancel}
                  </Button>
                  <Button
                    disabled={
                      isStale ||
                      !canSubmitStorageLocationL2Delete(
                        resolution,
                        targetPositionId,
                      )
                    }
                    onClick={() => setStep("confirm")}
                  >
                    {copy.continue}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <SourcePath context={context} />
                <DependencyCounts context={context} />
                {!hasItems && context.summary.positionCount > 0 ? (
                  <Alert variant="warning">{copy.emptySubtreeInfo}</Alert>
                ) : null}
                <p className="text-sm leading-6 text-muted">
                  {hasItems ? copy.finalSummary : copy.permanentInfo}
                </p>
                <dl className="grid gap-3 rounded-control border border-line bg-surface-muted p-4 text-sm">
                  <div>
                    <dt className="font-semibold">{copy.operation}</dt>
                    <dd className="mt-1 text-muted">{operationLabel}</dd>
                  </div>
                  {selectedTarget ? (
                    <div>
                      <dt className="font-semibold">{copy.chooseTarget}</dt>
                      <dd className="mt-1 break-words text-muted">
                        {selectedTarget.label}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                {resolution === "move" ? (
                  <Alert variant="warning">{copy.movedInfo}</Alert>
                ) : resolution === "detach" ? (
                  <Alert variant="warning">
                    {copy.detachedInfo} {copy.itemsRemain}
                  </Alert>
                ) : (
                  <Alert variant="warning">{copy.permanentInfo}</Alert>
                )}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  {hasItems ? (
                    <Button
                      disabled={isSubmitting}
                      onClick={() => setStep("choose")}
                      variant="secondary"
                    >
                      <ArrowLeftIcon aria-hidden="true" size={18} />
                      {copy.back}
                    </Button>
                  ) : (
                    <Button
                      disabled={isSubmitting}
                      onClick={closeDialog}
                      variant="secondary"
                    >
                      {copy.cancel}
                    </Button>
                  )}
                  <Button
                    disabled={
                      isSubmitting ||
                      isStale ||
                      !canSubmitStorageLocationL2Delete(
                        resolution,
                        targetPositionId,
                      )
                    }
                    onClick={() => void submitResolution()}
                    variant="danger"
                  >
                    <TrashIcon aria-hidden="true" size={18} />
                    {isSubmitting ? copy.loading : finalLabel}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}

function SourcePath({ context }: { context: LoadedContext }) {
  const copy = t.modules.home.furnitureDelete;

  return (
    <dl className="rounded-control border border-line bg-surface-muted p-4 text-sm">
      <dt className="font-semibold">{copy.sourcePath}</dt>
      <dd className="mt-1 break-words text-muted">{context.sourcePath}</dd>
    </dl>
  );
}

function DependencyCounts({ context }: { context: LoadedContext }) {
  const summary = context.summary;
  const copy = t.modules.home.furnitureDelete;
  const counts = [
    [copy.storageSpaces, summary.positionCount],
    [copy.activeItems, summary.activeItemsCount],
    [copy.archivedItems, summary.archivedItemsCount],
    [copy.totalItems, summary.totalDistinctItemsCount],
    [copy.primaryLinks, summary.primaryLocationLinksCount],
    [copy.additionalLinks, summary.nonPrimaryLocationLinksCount],
    [copy.totalLinks, summary.totalLocationLinksCount],
  ] as const;

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {counts.map(([label, value]) => (
        <div className="rounded-control border border-line p-3" key={label}>
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="mt-1 text-lg font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
