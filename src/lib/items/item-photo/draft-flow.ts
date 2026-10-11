import { settleItemFormAction } from "../item-form-action";
import {
  prepareItemPhotoForUpload,
  type ItemPhotoPreparationResult,
} from "./compress-image";

type UploadResult =
  | { ok: true; storagePath: string }
  | { ok: false; code: string };

export async function cleanupOwnedItemPhotoDraft(
  storagePath: string,
  cleanup: (storagePath: string) => Promise<{ ok: boolean }>,
) {
  const result = await settleItemFormAction(
    () => cleanup(storagePath),
    { ok: false },
  );
  return result.ok;
}

/** Keep the previous selection until a replacement upload is confirmed. */
export async function replaceItemPhotoDraft<T extends UploadResult>(input: {
  file: File;
  previousStoragePath?: string;
  upload: (file: File) => Promise<T>;
  cleanup: (storagePath: string) => Promise<{ ok: boolean }>;
  isCurrent: () => boolean;
  onUploading: () => void;
  prepare?: (file: File) => Promise<ItemPhotoPreparationResult>;
}): Promise<
  | { status: "uploaded"; upload: T & { ok: true }; file: File; cleanupFailed: boolean }
  | { status: "failed"; code: string }
  | { status: "stale" }
> {
  const prepared = await settleItemFormAction(
    () => (input.prepare ?? prepareItemPhotoForUpload)(input.file),
    { ok: false, code: "compression_failed" } as ItemPhotoPreparationResult,
  );
  if (!input.isCurrent()) return { status: "stale" };
  if (!prepared.ok) return { status: "failed", code: prepared.code };

  input.onUploading();
  let upload: T;
  try {
    upload = await input.upload(prepared.file);
  } catch {
    return input.isCurrent()
      ? { status: "failed", code: "upload_failed" }
      : { status: "stale" };
  }

  if (!input.isCurrent()) {
    if (upload.ok) {
      await cleanupOwnedItemPhotoDraft(upload.storagePath, input.cleanup);
    }
    return { status: "stale" };
  }
  if (!upload.ok) return { status: "failed", code: upload.code };

  const cleanupFailed = input.previousStoragePath
    ? !(await cleanupOwnedItemPhotoDraft(input.previousStoragePath, input.cleanup))
    : false;
  if (!input.isCurrent()) {
    await cleanupOwnedItemPhotoDraft(upload.storagePath, input.cleanup);
    return { status: "stale" };
  }

  return { status: "uploaded", upload: upload as T & { ok: true }, file: prepared.file, cleanupFailed };
}
