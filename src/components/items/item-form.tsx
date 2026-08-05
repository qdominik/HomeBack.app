"use client";

import Link from "next/link";
import Image from "next/image";
import {
  type ChangeEvent,
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
import {
  ITEM_TYPES,
  type ItemType,
  showsItemQuantity,
} from "@/lib/items/item-form-values";
import {
  getItemLocationFieldKey,
  getItemLocationFieldProps,
  type ItemCategoryOption,
  type ItemLocationSelectorOptions,
} from "@/lib/items/item-options";
import { routes } from "@/lib/routes";
import type { Database } from "@/types/database";
import { ItemLocationField } from "./item-location-field";
import { ItemSubmitButton } from "./item-submit-button";

type Item = Database["public"]["Tables"]["item"]["Row"];

type ItemFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: ItemCategoryOption[];
  defaultCategoryId?: string | null;
  item?: Item;
  layout?: "default" | "compact";
  locationOptions: ItemLocationSelectorOptions;
  photo?: ItemPhotoPersistedState | null;
  selectedPositionId?: string | null;
  submitLabel: string;
};

const ANOTHER_CATEGORY_VALUE = "__another_category__";

const typeLabels: Record<ItemType, string> = {
  unikalny: t.modules.items.itemTypes.unique,
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
  | "cleanup_failed";

type ItemPhotoAnalysisError = Exclude<
  ItemPhotoAnalysisActionResult,
  { ok: true }
>["code"];

const photoErrorMessages: Record<ItemPhotoDraftError, string> = {
  admin_required: t.modules.items.photo.errors.adminRequired,
  cleanup_failed: t.modules.items.photo.errors.cleanupFailed,
  file_too_large: t.modules.items.photo.errors.fileTooLarge,
  missing_file: t.modules.items.photo.errors.missingFile,
  preview_url_failed: t.modules.items.photo.errors.previewUrlFailed,
  unsupported_file_type: t.modules.items.photo.errors.unsupportedFileType,
  upload_failed: t.modules.items.photo.errors.uploadFailed,
};

const photoAnalysisErrorMessages: Record<ItemPhotoAnalysisError, string> = {
  admin_required: t.modules.items.photo.errors.adminRequired,
  categories_unavailable: t.modules.items.photo.errors.categoriesUnavailable,
  invalid_model_response: t.modules.items.photo.errors.analysisFailed,
  invalid_photo_input: t.modules.items.photo.errors.invalidPhotoInput,
  invalid_storage_path: t.modules.items.photo.errors.invalidStoragePath,
  missing_api_key: t.modules.items.photo.errors.aiNotConfigured,
  missing_model: t.modules.items.photo.errors.aiNotConfigured,
  preview_url_failed: t.modules.items.photo.errors.previewUrlFailed,
  provider_not_implemented: t.modules.items.photo.errors.analysisFailed,
  provider_request_failed: t.modules.items.photo.errors.analysisFailed,
  unsupported_provider: t.modules.items.photo.errors.aiNotConfigured,
};

export function ItemForm({
  action,
  categories,
  defaultCategoryId,
  item,
  layout = "default",
  locationOptions,
  photo = null,
  selectedPositionId,
  submitLabel,
}: ItemFormProps) {
  const isCompact = layout === "compact";
  const fullWidthClass = isCompact ? "sm:col-span-2" : "";
  const halfWidthClass = isCompact ? "sm:col-span-1" : "";
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
  const [isPhotoPending, startPhotoTransition] = useTransition();
  const [isPhotoAnalysisPending, startPhotoAnalysisTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoAnalysisRunIdRef = useRef(0);
  const photoMutationRunIdRef = useRef(0);
  const initialQuantity = item?.ilosc ?? 1;
  const [itemQuantity, setItemQuantity] = useState(String(initialQuantity));
  const [itemUnit, setItemUnit] = useState(item?.jednostka ?? "");
  const locationFieldProps = getItemLocationFieldProps(
    locationOptions,
    selectedPositionId,
  );
  const locationFieldKey = getItemLocationFieldKey(
    item?.id,
    selectedPositionId,
  );
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
      const result = await createQuickCustomCategory(submittedName);

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
    const result = await cleanupItemPhotoDraft({ storagePath });

    return result.ok;
  }

  function removePhotoDraft() {
    const currentDraft = photoDraft;
    const mutationRunId = photoMutationRunIdRef.current + 1;
    photoMutationRunIdRef.current = mutationRunId;
    resetPhotoAnalysisState();
    setPhotoDraft(null);
    if (item && photo && !removePersistedPhoto) {
      setPersistedPhoto(photo);
    }
    clearPhotoInput();

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
    });
  }

  function removeCurrentPhoto() {
    const currentDraft = photoDraft;
    const mutationRunId = photoMutationRunIdRef.current + 1;
    photoMutationRunIdRef.current = mutationRunId;
    resetPhotoAnalysisState();
    setPhotoDraft(null);
    setPersistedPhoto(null);
    setRemovePersistedPhoto(true);
    clearPhotoInput();

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
      }
    });
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
    setPhotoDraft(null);

    startPhotoTransition(async () => {
      if (previousDraft) {
        await cleanupDraft(previousDraft.storagePath);
      }

      if (mutationRunId !== photoMutationRunIdRef.current) {
        return;
      }

      const formData = new FormData();
      formData.set("photo", selectedFile);

      const result = await uploadItemPhotoDraft(formData);

      if (mutationRunId !== photoMutationRunIdRef.current) {
        return;
      }

      if (!result.ok) {
        setPhotoFeedback(
          photoErrorMessages[result.code] ?? t.modules.items.photo.errors.unknown,
        );
        clearPhotoInput();
        return;
      }

      setPhotoDraft({
        draftId: result.draftId,
        filename: selectedFile.name,
        mimeType: result.file.mimeType,
        previewUrl: result.previewUrl,
        sizeBytes: result.file.sizeBytes,
        storagePath: result.storagePath,
      });
      setPersistedPhoto(null);
      setRemovePersistedPhoto(false);
      setPhotoFeedback(t.modules.items.photo.ready);
    });
  }

  function applyPhotoSuggestions() {
    const analyzedDraft = photoDraft;

    if (!analyzedDraft) {
      return;
    }

    const analysisRunId = photoAnalysisRunIdRef.current + 1;
    photoAnalysisRunIdRef.current = analysisRunId;
    setPhotoFeedback(null);
    startPhotoAnalysisTransition(async () => {
      const result = await analyzeItemPhotoDraft({
        storagePath: analyzedDraft.storagePath,
        mimeType: analyzedDraft.mimeType,
        sizeBytes: analyzedDraft.sizeBytes,
      });

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

      if (suggestion.nazwa !== null) setItemName(suggestion.nazwa);
      if (suggestion.opis !== null) setItemDescription(suggestion.opis);
      if (suggestion.categoryId !== null) selectCategory(suggestion.categoryId);
      if (suggestion.typ !== null) setItemType(suggestion.typ);
      if (suggestion.ilosc !== null && suggestion.ilosc >= 1) {
        setItemQuantity(String(suggestion.ilosc));
      }
      if (suggestion.jednostka !== null) setItemUnit(suggestion.jednostka);

      setPhotoFeedback(
        suggestion.userMessage ?? t.modules.items.photo.suggestionsApplied,
      );
    });
  }

  return (
    <form
      action={action}
      className={isCompact ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}
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
      <label className={`block text-sm font-medium ${fullWidthClass}`}>
        {t.modules.items.name}
        <input
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
          onChange={(event) => setItemName(event.currentTarget.value)}
          name="nazwa"
          required
          value={itemName}
        />
      </label>
      <label className={`block text-sm font-medium ${fullWidthClass}`}>
        {t.modules.items.description}
        <textarea
          className="mt-1 min-h-20 w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-primary"
          name="opis"
          onChange={(event) => setItemDescription(event.currentTarget.value)}
          value={itemDescription}
        />
      </label>
      <label className={`block text-sm font-medium ${halfWidthClass}`}>
        {t.modules.items.itemType}
        <select
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
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
        </select>
      </label>
      {showsItemQuantity(itemType) ? (
        <label className={`block text-sm font-medium ${halfWidthClass}`}>
          {t.modules.items.quantity}
          <input
            className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
            key={itemType}
            min="1"
            name="ilosc"
            onChange={(event) => setItemQuantity(event.currentTarget.value)}
            required
            step="1"
            type="number"
            value={itemQuantity}
          />
        </label>
      ) : (
        <input name="ilosc" type="hidden" value="1" />
      )}
      <label className={`block text-sm font-medium ${halfWidthClass}`}>
        {t.modules.items.unit}
        <input
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
          name="jednostka"
          onChange={(event) => setItemUnit(event.currentTarget.value)}
          value={itemUnit}
        />
      </label>
      <label className={`block text-sm font-medium ${halfWidthClass}`}>
        {t.modules.items.category}
        <select
          className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
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
        </select>
      </label>
      {isAnotherCategorySelected ? (
        <div
          className={`space-y-2 rounded-md border border-line bg-surface-muted p-3 ${fullWidthClass}`}
        >
          <label className="block text-sm font-medium">
            {t.modules.items.newCategoryName}
            <input
              className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
              onChange={(event) => setNewCategoryName(event.currentTarget.value)}
              value={newCategoryName}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isQuickCategoryPending}
              onClick={createQuickCategory}
              type="button"
            >
              {isQuickCategoryPending
                ? t.modules.items.saving
                : t.modules.items.addQuickCategory}
            </button>
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
      <section
        className={`space-y-3 rounded-md border border-line bg-surface-muted p-3 ${fullWidthClass}`}
      >
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t.modules.items.photo.title}
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            {t.modules.items.photo.help}
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center">
          <span className="sr-only">{t.modules.items.photo.choose}</span>
          <span className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold leading-5 text-white hover:bg-primary-strong">
            {t.modules.items.photo.choose}
          </span>
          <input
            accept="image/jpeg,image/webp"
            className="sr-only"
            disabled={isPhotoPending || isPhotoAnalysisPending}
            onChange={uploadSelectedPhoto}
            ref={fileInputRef}
            type="file"
          />
        </label>
        {isPhotoPending ? (
          <p className="text-sm text-muted">{t.modules.items.photo.uploading}</p>
        ) : null}
        {isPhotoAnalysisPending ? (
          <p className="text-sm text-muted">{t.modules.items.photo.analyzing}</p>
        ) : null}
        {displayedPhoto ? (
          <div className="grid gap-3 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center">
            {displayedPhoto.previewUrl ? (
              <Image
                alt={t.modules.items.photo.previewAlt}
                className="h-24 w-24 rounded-md border border-line object-cover"
                height={96}
                src={displayedPhoto.previewUrl}
                unoptimized
                width={96}
              />
            ) : (
              <div className="h-24 w-24 rounded-md border border-dashed border-line bg-surface" />
            )}
            <div className="min-w-0 text-xs leading-5 text-muted">
              <p className="truncate font-medium text-foreground">
                {displayedPhoto.filename}
              </p>
              <p>
                {displayedPhoto.mimeType} · {Math.ceil(displayedPhoto.sizeBytes / 1024)} KB
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {photoDraft ? (
                <button
                  className="min-h-10 rounded-md bg-primary px-4 py-2 text-sm font-semibold leading-5 text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isPhotoPending || isPhotoAnalysisPending}
                  onClick={applyPhotoSuggestions}
                  type="button"
                >
                  {isPhotoAnalysisPending
                    ? t.modules.items.photo.analyzing
                    : t.modules.items.photo.fillFromPhoto}
                </button>
              ) : null}
              <button
                className="min-h-10 rounded-md border border-line bg-surface px-4 py-2 text-sm font-semibold leading-5 text-primary-strong hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isPhotoPending || isPhotoAnalysisPending}
                onClick={photoDraft ? removePhotoDraft : removeCurrentPhoto}
                type="button"
              >
                {isPhotoPending
                  ? t.modules.items.photo.removing
                  : t.modules.items.photo.remove}
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
      <div className={fullWidthClass}>
        <ItemLocationField key={locationFieldKey} {...locationFieldProps} />
      </div>
      <ItemSubmitButton
        className={`inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-70 ${fullWidthClass} ${isCompact ? "justify-self-start" : ""}`}
        disabled={isAnotherCategorySelected || isQuickCategoryPending}
        label={submitLabel}
        pendingLabel={t.modules.items.saving}
      />
    </form>
  );
}
