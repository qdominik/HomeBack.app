"use client";

import { ImageSquareIcon } from "@phosphor-icons/react/dist/ssr/ImageSquare";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  analyzeItemPhotoDraft,
  cleanupItemPhotoDraft,
  createQuickCustomCategory,
  uploadItemPhotoDraft,
  type ItemPhotoAnalysisActionResult,
  type ItemPhotoDraftUploadResult,
} from "@/app/(app)/items/actions";
import { resolveInitialItemCategoryId } from "@/lib/categories/category-selection";
import { t } from "@/lib/i18n";
import { settleItemFormAction } from "@/lib/items/item-form-action";
import {
  isItemPhotoWeakSuggestion,
  resolveItemPhotoSuggestionName,
} from "@/lib/items/item-photo-ai/apply-suggestion";
import {
  ITEM_TYPES,
  type ItemType,
  showsItemQuantity,
} from "@/lib/items/item-form-values";
import type { ItemPhotoPreparationError } from "@/lib/items/item-photo/compress-image";
import {
  cleanupOwnedItemPhotoDraft,
  replaceItemPhotoDraft,
} from "@/lib/items/item-photo/draft-flow";
import {
  getInitialItemLocationSelection,
  getItemLocationFieldKey,
  type ItemLocationSelection,
  type ItemCategoryOption,
  type ItemLocationSelectorOptions,
} from "@/lib/items/item-options";
import { routes } from "@/lib/routes";
import type { Database } from "@/types/database";
import { ItemLocationField, ItemLocationSummary } from "./item-location-field";
import { ItemPhotoImage } from "./item-photo-image";
import { ItemSubmitButton } from "./item-submit-button";

type Item = Database["public"]["Tables"]["item"]["Row"];

type ItemFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: ItemCategoryOption[];
  defaultCategoryId?: string | null;
  item?: Item;
  locationOptions: ItemLocationSelectorOptions;
  photo?: ItemPhotoPersistedState | null;
  selectedPositionId?: string | null;
  selectedStorageId?: string | null;
  selectedRoomId?: string | null;
  submitLabel: string;
};

const ANOTHER_CATEGORY_VALUE = "__another_category__";

const typeLabels: Record<ItemType, string> = {
  unikalny: t.modules.items.singleItemLabel,
  zapas: t.modules.items.itemTypes.stock,
  zestaw: t.modules.items.itemTypes.set,
};

type ItemPhotoDraftState = {
  draftId: string;
  filename: string;
  mimeType: string;
  previewUrl: string;
  sizeBytes: number;
  storagePath: string;
};

type ItemPhotoPersistedState = {
  filename: string;
  mimeType: string;
  previewUrl: string | null;
  sizeBytes: number;
  storagePath: string;
};

type ItemPhotoDraftError =
  | Exclude<ItemPhotoDraftUploadResult, { ok: true }>["code"]
  | ItemPhotoPreparationError
  | "cleanup_failed";

type ItemPhotoAnalysisError = Exclude<
  ItemPhotoAnalysisActionResult,
  { ok: true }
>["code"];

const photoErrorMessages: Record<ItemPhotoDraftError, string> = {
  admin_required: t.modules.items.photo.errors.adminRequired,
  compression_failed: t.modules.items.photo.errors.compressionFailed,
  cleanup_failed: t.modules.items.photo.errors.cleanupFailed,
  file_too_large: t.modules.items.photo.errors.fileTooLarge,
  file_too_large_after_compression:
    t.modules.items.photo.errors.fileTooLargeAfterCompression,
  missing_file: t.modules.items.photo.errors.missingFile,
  preview_url_failed: t.modules.items.photo.errors.previewUrlFailed,
  unsupported_file_type: t.modules.items.photo.errors.unsupportedFileType,
  upload_failed: t.modules.items.photo.errors.uploadFailed,
};

const photoAnalysisErrorMessages: Record<ItemPhotoAnalysisError, string> = {
  admin_required: t.modules.items.photo.errors.adminRequired,
  categories_unavailable: t.modules.items.photo.errors.categoriesUnavailable,
  invalid_model_response: t.modules.items.photo.errors.analysisFailed,
  image_too_large: t.modules.items.photo.errors.analysisFailed,
  invalid_photo_input: t.modules.items.photo.errors.invalidPhotoInput,
  invalid_storage_path: t.modules.items.photo.errors.invalidStoragePath,
  missing_api_key: t.modules.items.photo.errors.aiNotConfigured,
  missing_model: t.modules.items.photo.errors.aiNotConfigured,
  preview_url_failed: t.modules.items.photo.errors.previewUrlFailed,
  provider_not_implemented: t.modules.items.photo.errors.analysisFailed,
  provider_forbidden: t.modules.items.photo.errors.analysisFailed,
  provider_invalid_request: t.modules.items.photo.errors.analysisFailed,
  provider_model_not_found: t.modules.items.photo.errors.analysisFailed,
  provider_request_failed: t.modules.items.photo.errors.analysisFailed,
  provider_rate_limited: t.modules.items.photo.errors.analysisFailed,
  provider_server_error: t.modules.items.photo.errors.analysisFailed,
  provider_timeout: t.modules.items.photo.errors.analysisFailed,
  provider_unauthorized: t.modules.items.photo.errors.analysisFailed,
  response_not_json: t.modules.items.photo.errors.analysisFailed,
  response_schema_invalid: t.modules.items.photo.errors.analysisFailed,
  unsupported_provider: t.modules.items.photo.errors.aiNotConfigured,
};

export function ItemForm({
  action,
  categories,
  defaultCategoryId,
  item,
  locationOptions,
  photo = null,
  selectedPositionId,
  selectedStorageId,
  selectedRoomId,
  submitLabel,
}: ItemFormProps) {
  const quantityId = useId();
  const unitListId = useId();
  const [itemType, setItemType] = useState<ItemType>(item?.typ ?? "unikalny");
  const [itemName, setItemName] = useState(item?.nazwa ?? "");
  const [itemDescription, setItemDescription] = useState(item?.opis ?? "");
  const [availableCategories, setAvailableCategories] = useState(categories);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    resolveInitialItemCategoryId(item?.category_id, defaultCategoryId),
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [quickCategoryFeedback, setQuickCategoryFeedback] = useState<
    string | null
  >(null);
  const [isQuickCategoryPending, startQuickCategoryTransition] =
    useTransition();
  const [photoDraft, setPhotoDraft] = useState<ItemPhotoDraftState | null>(null);
  const [persistedPhoto, setPersistedPhoto] =
    useState<ItemPhotoPersistedState | null>(photo);
  const [removePersistedPhoto, setRemovePersistedPhoto] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);
  const [photoPreviewFailed, setPhotoPreviewFailed] = useState(false);
  const [isPhotoPending, startPhotoTransition] = useTransition();
  const [isPhotoAnalysisPending, startPhotoAnalysisTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemNameEditRevisionRef = useRef(0);
  const photoAnalysisRunIdRef = useRef(0);
  const photoMutationRunIdRef = useRef(0);
  const initialQuantity = item?.ilosc ?? 1;
  const [itemQuantity, setItemQuantity] = useState(String(initialQuantity));
  const [itemUnit, setItemUnit] = useState(item ? (item.jednostka ?? "") : "szt.");
  const locationKey = getItemLocationFieldKey(item?.id, selectedPositionId, selectedStorageId, selectedRoomId);
  const [locationState, setLocationState] = useState(() => ({
    key: locationKey,
    selection: getInitialItemLocationSelection(locationOptions, selectedPositionId, selectedStorageId, selectedRoomId),
  }));
  let locationSelection = locationState.selection;
  if (locationState.key !== locationKey) {
    locationSelection = getInitialItemLocationSelection(locationOptions, selectedPositionId, selectedStorageId, selectedRoomId);
    setLocationState({ key: locationKey, selection: locationSelection });
  }
  const setLocationSelection: Dispatch<SetStateAction<ItemLocationSelection>> = (update) => {
    setLocationState((current) => ({
      key: current.key,
      selection: typeof update === "function" ? update(current.selection) : update,
    }));
  };
  const systemCategories = availableCategories.filter(
    (category) => category.isSystem,
  );
  const customCategories = availableCategories.filter(
    (category) => !category.isSystem,
  );
  const isAnotherCategorySelected =
    selectedCategoryId === ANOTHER_CATEGORY_VALUE;
  const displayedPhoto = photoDraft ?? persistedPhoto;

  function selectCategory(value: string) {
    setSelectedCategoryId(value);
    setQuickCategoryFeedback(null);

    if (value !== ANOTHER_CATEGORY_VALUE) {
      setNewCategoryName("");
    }
  }

  function createQuickCategory() {
    const submittedName = newCategoryName.trim();

    if (!submittedName) {
      setQuickCategoryFeedback(t.modules.items.quickCategoryMissing);
      return;
    }

    startQuickCategoryTransition(async () => {
      const result = await settleItemFormAction(
        () => createQuickCustomCategory(submittedName),
        { status: "action_failed" },
      );

      if (result.status === "created" || result.status === "existing") {
        setAvailableCategories((currentCategories) =>
          currentCategories.some(
            (category) => category.id === result.category.id,
          )
            ? currentCategories
            : [
                ...currentCategories,
                {
                  id: result.category.id,
                  isSystem: result.category.isSystem,
                  label: result.category.label,
                },
              ],
        );
        setSelectedCategoryId(result.category.id);
        setNewCategoryName("");
        setQuickCategoryFeedback(
          result.status === "created"
            ? t.modules.items.categoryCreatedAndSelected
            : t.modules.items.categoryAlreadyExists,
        );
        return;
      }

      if (result.status === "missing_fields") {
        setQuickCategoryFeedback(t.modules.items.quickCategoryMissing);
        return;
      }

      if (result.status === "admin_required") {
        setQuickCategoryFeedback(t.modules.items.errors.adminRequired);
        return;
      }

      setQuickCategoryFeedback(t.modules.items.errors.actionFailed);
    });
  }

  function clearPhotoInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function resetPhotoAnalysisState() {
    photoAnalysisRunIdRef.current += 1;
    setPhotoFeedback(null);
  }

  async function cleanupDraft(storagePath: string) {
    return cleanupOwnedItemPhotoDraft(storagePath, (path) =>
      cleanupItemPhotoDraft({ storagePath: path }),
    );
  }

  function removePhotoDraft() {
    const currentDraft = photoDraft;
    const mutationRunId = photoMutationRunIdRef.current + 1;
    photoMutationRunIdRef.current = mutationRunId;
    resetPhotoAnalysisState();
    if (!currentDraft) {
      return;
    }

    startPhotoTransition(async () => {
      const cleaned = await cleanupDraft(currentDraft.storagePath);

      if (mutationRunId !== photoMutationRunIdRef.current) {
        return;
      }

      if (!cleaned) {
        setPhotoFeedback(t.modules.items.photo.errors.cleanupFailed);
        return;
      }
      setPhotoDraft(null);
      setPhotoPreviewFailed(false);
      if (item && photo && !removePersistedPhoto) {
        setPersistedPhoto(photo);
      }
      clearPhotoInput();
    });
  }

  function removeCurrentPhoto() {
    photoMutationRunIdRef.current += 1;
    resetPhotoAnalysisState();
    setPhotoDraft(null);
    setPhotoPreviewFailed(false);
    setPersistedPhoto(null);
    setRemovePersistedPhoto(true);
    clearPhotoInput();
  }

  function uploadSelectedPhoto(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.currentTarget.files?.[0] ?? null;
    const previousDraft = photoDraft;

    if (!selectedFile) {
      return;
    }

    const mutationRunId = photoMutationRunIdRef.current + 1;
    photoMutationRunIdRef.current = mutationRunId;
    resetPhotoAnalysisState();
    setPhotoFeedback(t.modules.items.photo.preparing);

    startPhotoTransition(async () => {
      const outcome = await replaceItemPhotoDraft({
        file: selectedFile,
        previousStoragePath: previousDraft?.storagePath,
        isCurrent: () => mutationRunId === photoMutationRunIdRef.current,
        onUploading: () => setPhotoFeedback(t.modules.items.photo.uploading),
        cleanup: (storagePath) => cleanupItemPhotoDraft({ storagePath }),
        upload: (file) => {
          const formData = new FormData();
          formData.set("photo", file);
          return uploadItemPhotoDraft(formData);
        },
      });

      if (outcome.status === "stale") {
        return;
      }

      if (outcome.status === "failed") {
        setPhotoFeedback(
          photoErrorMessages[outcome.code as ItemPhotoDraftError] ??
            t.modules.items.photo.errors.unknown,
        );
        clearPhotoInput();
        return;
      }

      const result = outcome.upload;
      setPhotoDraft({
        draftId: result.draftId,
        filename: outcome.file.name,
        mimeType: result.file.mimeType,
        previewUrl: result.previewUrl,
        sizeBytes: result.file.sizeBytes,
        storagePath: result.storagePath,
      });
      setPersistedPhoto(null);
      setRemovePersistedPhoto(false);
      setPhotoPreviewFailed(false);
      setPhotoFeedback(outcome.cleanupFailed
        ? t.modules.items.photo.errors.replacementCleanupFailed
        : null);
    });
  }

  function applyPhotoSuggestions() {
    const analyzedDraft = photoDraft;

    if (!analyzedDraft) {
      return;
    }

    const analysisRunId = photoAnalysisRunIdRef.current + 1;
    const nameEditRevision = itemNameEditRevisionRef.current;
    photoAnalysisRunIdRef.current = analysisRunId;
    setPhotoFeedback(null);
    startPhotoAnalysisTransition(async () => {
      const result = await settleItemFormAction<ItemPhotoAnalysisActionResult>(
        () => analyzeItemPhotoDraft({
          storagePath: analyzedDraft.storagePath,
          mimeType: analyzedDraft.mimeType,
          sizeBytes: analyzedDraft.sizeBytes,
        }),
        { ok: false, code: "provider_request_failed" },
      );

      if (analysisRunId !== photoAnalysisRunIdRef.current) {
        return;
      }

      if (!result.ok) {
        setPhotoFeedback(
          photoAnalysisErrorMessages[result.code] ??
            t.modules.items.photo.errors.analysisFailed,
        );
        return;
      }

      const { suggestion } = result;

      setItemName((currentName) => resolveItemPhotoSuggestionName(
        currentName,
        suggestion,
        nameEditRevision !== itemNameEditRevisionRef.current,
      ));
      if (suggestion.opis !== null) setItemDescription(suggestion.opis);
      if (suggestion.categoryId !== null) selectCategory(suggestion.categoryId);
      if (suggestion.typ !== null) setItemType(suggestion.typ);
      if (suggestion.ilosc !== null && suggestion.ilosc >= 1) {
        setItemQuantity(String(suggestion.ilosc));
      }
      if (suggestion.jednostka !== null) setItemUnit(suggestion.jednostka);

      setPhotoFeedback(
        suggestion.userMessage ?? (isItemPhotoWeakSuggestion(suggestion)
          ? t.modules.items.photo.noConfidentMatch
          : t.modules.items.photo.suggestionsApplied),
      );
    });
  }

  return (
    <form
      action={action}
      aria-label={item ? t.modules.items.editItem : undefined}
      className="@container grid min-w-0 max-w-full gap-3 [&_.ui-control:not(:disabled):not([readonly])]:!bg-white"
    >
      {item ? <input name="item_id" type="hidden" value={item.id} /> : null}
      {photoDraft ? (
        <>
          <input
            name="item_photo_draft_path"
            type="hidden"
            value={photoDraft.storagePath}
          />
          <input
            name="item_photo_mime_type"
            type="hidden"
            value={photoDraft.mimeType}
          />
          <input
            name="item_photo_size_bytes"
            type="hidden"
            value={photoDraft.sizeBytes}
          />
        </>
      ) : null}
      {item && removePersistedPhoto && !photoDraft ? (
        <input name="item_photo_remove_current" type="hidden" value="1" />
      ) : null}
      <div className="grid min-w-0 gap-4 @min-[36rem]:grid-cols-[minmax(0,1fr)_14rem]">
      <div className="grid min-w-0 content-start gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{t.modules.items.itemDetailsHeading}</h3>
          <input
            accept="image/jpeg,image/webp"
            aria-label={t.modules.items.photo.add}
            aria-hidden="true"
            className="sr-only"
            disabled={isPhotoPending || isPhotoAnalysisPending}
            onChange={uploadSelectedPhoto}
            ref={fileInputRef}
            tabIndex={-1}
            type="file"
          />
          {!displayedPhoto ? (
            <Button variant="secondary" disabled={isPhotoPending || isPhotoAnalysisPending} onClick={() => fileInputRef.current?.click()}>
              <ImageSquareIcon aria-hidden="true" size={18} />{t.modules.items.photo.add}
            </Button>
          ) : null}
      </div>
      <p className="-mt-2 text-sm text-muted">{t.modules.items.itemDetailsIntro}</p>
      <section className="space-y-2">
        {isPhotoPending ? (
          <p className="text-sm text-muted">{t.modules.items.photo.uploading}</p>
        ) : null}
        {isPhotoAnalysisPending ? (
          <p className="text-sm text-muted">{t.modules.items.photo.analyzing}</p>
        ) : null}
        {displayedPhoto ? (
          <div className="flex flex-wrap items-start gap-4">
            {displayedPhoto.previewUrl && !photoPreviewFailed ? (
              <ItemPhotoImage
                alt={t.modules.items.photo.previewAlt}
                className="h-32 w-32 shrink-0 rounded-md border border-line"
                onError={() => setPhotoPreviewFailed(true)}
                size={128}
                src={displayedPhoto.previewUrl}
              />
            ) : (
              <div className="h-32 w-32 shrink-0 rounded-md border border-dashed border-line bg-surface" />
            )}
            <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {photoDraft ? (
                <Button

                  disabled={isPhotoPending || isPhotoAnalysisPending}
                  onClick={applyPhotoSuggestions}
                  type="button"
                >
                  {isPhotoAnalysisPending
                    ? t.modules.items.photo.analyzing
                    : t.modules.items.photo.fillFromPhoto}
                </Button>
              ) : null}
              <Button variant="secondary" disabled={isPhotoPending || isPhotoAnalysisPending} onClick={() => fileInputRef.current?.click()}>
                {t.modules.items.photo.change}
              </Button>
            </div>
            <button
              aria-label={t.modules.items.photo.remove}
              className="min-h-11 text-sm text-muted underline underline-offset-4 hover:text-foreground"
              disabled={isPhotoPending || isPhotoAnalysisPending}
              onClick={photoDraft ? removePhotoDraft : removeCurrentPhoto}
              type="button"
            >
              {isPhotoPending ? t.modules.items.photo.removing : t.modules.items.photo.removeShort}
            </button>
            </div>
          </div>
        ) : null}
        {photoFeedback ? (
          <p
            className={`text-sm ${
              displayedPhoto ? "text-primary-strong" : "text-danger"
            }`}
          >
            {photoFeedback}
          </p>
        ) : null}
      </section>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7.5rem] gap-3">
      <label className="ui-label col-span-2 min-w-0">
        {t.modules.items.name} <span aria-hidden="true">*</span>
        <Input
          className="mt-2"
          onChange={(event) => {
            itemNameEditRevisionRef.current += 1;
            setItemName(event.currentTarget.value);
          }}
          name="nazwa"
          required
          value={itemName}
        />
      </label>
        <div className="ui-label min-w-0">
          <label htmlFor={quantityId}>{t.modules.items.quantity}</label>
          {showsItemQuantity(itemType) ? (
            <div className="mt-2 flex items-stretch">
              <button type="button" aria-label={t.modules.items.decreaseQuantity} className="min-h-11 min-w-11 rounded-l-control border border-line bg-surface" onClick={() => setItemQuantity((current) => String(Math.max(1, (Number.parseInt(current, 10) || 1) - 1)))}>−</button>
              <Input id={quantityId} className="min-w-0 flex-1 rounded-none !px-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" min="1" name="ilosc" onChange={(event) => setItemQuantity(event.currentTarget.value)} required step="1" type="number" value={itemQuantity} />
              <button type="button" aria-label={t.modules.items.increaseQuantity} className="min-h-11 min-w-11 rounded-r-control border border-line bg-surface" onClick={() => setItemQuantity((current) => String(Math.min(Number.MAX_SAFE_INTEGER, (Number.parseInt(current, 10) || 0) + 1)))}>+</button>
            </div>
          ) : (<><input name="ilosc" type="hidden" value="1" /><Input id={quantityId} className="mt-2" value="1" readOnly /></>)}
        </div>
      <label className="ui-label min-w-0">
        {t.modules.items.itemType}
        <Select
          className="mt-2 !px-2 !text-sm"
          name="typ"
          onChange={(event) =>
            setItemType(event.currentTarget.value as ItemType)
          }
          value={itemType}
        >
          {ITEM_TYPES.map((type) => (
            <option key={type} value={type}>
              {typeLabels[type]}
            </option>
          ))}
        </Select>
      </label>
      <label className="ui-label min-w-0">
        {t.modules.items.category} <span aria-hidden="true">*</span>
        <Select
          className="mt-2 !px-2 !text-sm"
          name="category_id"
          onChange={(event) => selectCategory(event.currentTarget.value)}
          required
          value={selectedCategoryId}
        >
          <option disabled value="">
            {t.modules.items.selectCategory}
          </option>
          <optgroup label={t.modules.items.systemCategories}>
            {systemCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </optgroup>
          <optgroup label={t.modules.items.customCategories}>
            {customCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </optgroup>
          <option value={ANOTHER_CATEGORY_VALUE}>
            {t.modules.items.anotherCategory}
          </option>
        </Select>
      </label>
      <label className="ui-label min-w-0">
        {t.modules.items.unit}
        <Input className="mt-2" list={unitListId} name="jednostka" onChange={(event) => setItemUnit(event.currentTarget.value)} value={itemUnit} />
        <datalist id={unitListId}>{["szt.", "opak.", "kpl.", "kg", "g", "l", "ml", "m"].map((unit) => <option key={unit} value={unit} />)}</datalist>
      </label>
      </div>
      <label className="ui-label">
        {t.modules.items.description} <span className="font-normal text-muted">· {t.modules.items.optional}</span>
        <Textarea
          className="ui-item-description mt-2"
          name="opis"
          onChange={(event) => setItemDescription(event.currentTarget.value)}
          rows={2}
          value={itemDescription}
        />
      </label>
      {isAnotherCategorySelected ? (
        <div
          className="space-y-2 rounded-md border border-line bg-surface-muted p-3"
        >
          <label className="ui-label">
            {t.modules.items.newCategoryName}
            <Input
              className="mt-2"
              onChange={(event) => setNewCategoryName(event.currentTarget.value)}
              value={newCategoryName}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button

              disabled={isQuickCategoryPending}
              onClick={createQuickCategory}
              type="button"
            >
              {isQuickCategoryPending
                ? t.modules.items.saving
                : t.modules.items.addQuickCategory}
            </Button>
            <Link
              className="text-sm font-semibold text-primary-strong hover:text-primary"
              href={routes.categories}
            >
              {t.modules.items.manageCategories}
            </Link>
          </div>
          {quickCategoryFeedback ? (
            <p className="text-sm text-muted">{quickCategoryFeedback}</p>
          ) : null}
        </div>
      ) : null}

      <ItemLocationField options={locationOptions} selection={locationSelection} setSelection={setLocationSelection} />
      <ItemSubmitButton
        className="justify-self-end"
        disabled={
          isAnotherCategorySelected ||
          isQuickCategoryPending ||
          isPhotoPending ||
          isPhotoAnalysisPending
        }
        label={submitLabel}
        pendingLabel={t.modules.items.saving}
      />
      </div>
      <ItemLocationSummary options={locationOptions} selection={locationSelection} />
      </div>
    </form>
  );
}
