import {
  ITEM_PHOTO_ALLOWED_MIME_TYPES,
  type ItemPhotoAllowedMimeType,
} from "../item-photo-storage";

/** Keep uploads comfortably below Next Server Actions' 1 MiB default. */
export const ITEM_PHOTO_UPLOAD_TARGET_BYTES = 750 * 1024;
export const ITEM_PHOTO_UPLOAD_MAX_BYTES = 800 * 1024;
export const ITEM_PHOTO_COMPRESSION_MAX_DIMENSION = 1600;
export const ITEM_PHOTO_COMPRESSION_ATTEMPTS = [
  { scale: 1, quality: 0.82 },
  { scale: 0.85, quality: 0.74 },
  { scale: 0.7, quality: 0.66 },
  { scale: 0.55, quality: 0.58 },
  { scale: 0.4, quality: 0.5 },
] as const;

export type ItemPhotoPreparationError =
  | "unsupported_file_type"
  | "compression_failed"
  | "file_too_large_after_compression";

export type ItemPhotoPreparationResult =
  | { ok: true; file: File; wasCompressed: boolean }
  | { ok: false; code: ItemPhotoPreparationError };

type ImageBitmapLike = {
  width: number;
  height: number;
  source?: unknown;
  close?: () => void;
};

type BrowserCompressionGlobals = {
  createImageBitmap?: (file: File) => Promise<ImageBitmapLike>;
  document?: {
    createElement: (tagName: "canvas") => {
      width: number;
      height: number;
      getContext: (contextId: "2d") => {
        drawImage: (
          image: unknown,
          dx: number,
          dy: number,
          dw: number,
          dh: number,
        ) => void;
      } | null;
      toBlob: (
        callback: (blob: Blob | null) => void,
        type?: string,
        quality?: number,
      ) => void;
    };
  };
  Image?: new () => {
    crossOrigin: string | null;
    decode?: () => Promise<void>;
    height: number;
    naturalHeight: number;
    naturalWidth: number;
    onerror: (() => void) | null;
    onload: (() => void) | null;
    src: string;
    width: number;
  };
  URL?: {
    createObjectURL: (value: Blob) => string;
    revokeObjectURL: (url: string) => void;
  };
};

export type ItemPhotoCompressionRuntime = {
  createBitmap: (file: File) => Promise<ImageBitmapLike>;
  createBlob: (input: {
    image: ImageBitmapLike;
    width: number;
    height: number;
    mimeType: ItemPhotoAllowedMimeType;
    quality: number;
  }) => Promise<Blob | null>;
};

export function isItemPhotoCompressibleMimeType(
  mimeType: string,
): mimeType is ItemPhotoAllowedMimeType {
  return ITEM_PHOTO_ALLOWED_MIME_TYPES.includes(
    mimeType as ItemPhotoAllowedMimeType,
  );
}

export function getItemPhotoCompressionDimensions(input: {
  width: number;
  height: number;
  scale?: number;
  maxDimension?: number;
}) {
  const maxDimension =
    input.maxDimension ?? ITEM_PHOTO_COMPRESSION_MAX_DIMENSION;
  const longestSide = Math.max(input.width, input.height);
  const baseScale = longestSide > maxDimension ? maxDimension / longestSide : 1;
  const scale = baseScale * (input.scale ?? 1);

  return {
    width: Math.max(1, Math.round(input.width * scale)),
    height: Math.max(1, Math.round(input.height * scale)),
  };
}

function getCompressedItemPhotoFilename(
  filename: string,
  mimeType: ItemPhotoAllowedMimeType,
) {
  const baseName = filename.replace(/\.[^./\\]+$/, "").trim() || "item-photo";
  return `${baseName}.${mimeType === "image/webp" ? "webp" : "jpg"}`;
}

export async function prepareItemPhotoForUpload(
  file: File,
  runtime = createBrowserItemPhotoCompressionRuntime(),
): Promise<ItemPhotoPreparationResult> {
  if (!isItemPhotoCompressibleMimeType(file.type)) {
    return { ok: false, code: "unsupported_file_type" };
  }

  if (file.size <= ITEM_PHOTO_UPLOAD_MAX_BYTES) {
    return { ok: true, file, wasCompressed: false };
  }

  let image: ImageBitmapLike | null = null;
  let createdBlob = false;

  try {
    image = await runtime.createBitmap(file);

    for (const attempt of ITEM_PHOTO_COMPRESSION_ATTEMPTS) {
      const dimensions = getItemPhotoCompressionDimensions({
        height: image.height,
        scale: attempt.scale,
        width: image.width,
      });
      const blob = await runtime.createBlob({
        height: dimensions.height,
        image,
        mimeType: file.type,
        quality: attempt.quality,
        width: dimensions.width,
      });

      if (!blob) continue;
      createdBlob = true;

      if (blob.size <= ITEM_PHOTO_UPLOAD_TARGET_BYTES) {
        return {
          ok: true,
          file: new File(
            [blob],
            getCompressedItemPhotoFilename(file.name, file.type),
            { lastModified: file.lastModified, type: file.type },
          ),
          wasCompressed: true,
        };
      }
    }

    return {
      ok: false,
      code: createdBlob
        ? "file_too_large_after_compression"
        : "compression_failed",
    };
  } catch {
    return { ok: false, code: "compression_failed" };
  } finally {
    image?.close?.();
  }
}

function createBrowserItemPhotoCompressionRuntime(): ItemPhotoCompressionRuntime {
  return {
    async createBitmap(file) {
      const browserGlobals = globalThis as BrowserCompressionGlobals;

      if (typeof browserGlobals.createImageBitmap === "function") {
        return browserGlobals.createImageBitmap(file);
      }

      if (!browserGlobals.Image || !browserGlobals.URL) {
        throw new Error("image decoding is unavailable");
      }

      const objectUrl = browserGlobals.URL.createObjectURL(file);
      const image = new browserGlobals.Image();
      image.crossOrigin = "anonymous";
      image.src = objectUrl;

      try {
        if (typeof image.decode === "function") {
          await image.decode();
        } else {
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error("image decode failed"));
          });
        }
      } catch (error) {
        browserGlobals.URL.revokeObjectURL(objectUrl);
        throw error;
      }

      return {
        close: () => browserGlobals.URL?.revokeObjectURL(objectUrl),
        height: image.naturalHeight || image.height,
        source: image,
        width: image.naturalWidth || image.width,
      };
    },
    async createBlob({ image, width, height, mimeType, quality }) {
      const browserGlobals = globalThis as BrowserCompressionGlobals;
      if (!browserGlobals.document) {
        throw new Error("canvas is unavailable");
      }

      const canvas = browserGlobals.document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.drawImage(image.source ?? image, 0, 0, width, height);

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, mimeType, quality);
      });
    },
  };
}
