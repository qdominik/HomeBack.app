import {
  ITEM_PHOTO_ALLOWED_MIME_TYPES,
  ITEM_PHOTO_MAX_SIZE_BYTES,
  type ItemPhotoAllowedMimeType,
} from "../item-photo-storage";

export const ITEM_PHOTO_COMPRESSION_MAX_DIMENSION = 1600;
export const ITEM_PHOTO_COMPRESSION_QUALITIES = [0.82, 0.72, 0.62] as const;

export type ItemPhotoPreparationError =
  | "unsupported_file_type"
  | "file_too_large_after_compression"
  | "compression_failed";

export type ItemPhotoPreparationResult =
  | {
      ok: true;
      file: File;
      wasCompressed: boolean;
    }
  | {
      ok: false;
      code: ItemPhotoPreparationError;
    };

type ImageBitmapLike = {
  width: number;
  height: number;
  close?: () => void;
  source?: unknown;
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

export type ItemPhotoPreparationOptions = {
  allowUnsupportedImageTranscode?: boolean;
};

export function isItemPhotoCompressibleMimeType(
  mimeType: string,
): mimeType is ItemPhotoAllowedMimeType {
  return ITEM_PHOTO_ALLOWED_MIME_TYPES.includes(
    mimeType as ItemPhotoAllowedMimeType,
  );
}

export function shouldCompressItemPhoto(file: File): boolean {
  return file.size > ITEM_PHOTO_MAX_SIZE_BYTES;
}

export function getItemPhotoCompressionDimensions(input: {
  width: number;
  height: number;
  maxDimension?: number;
}): { width: number; height: number } {
  const maxDimension =
    input.maxDimension ?? ITEM_PHOTO_COMPRESSION_MAX_DIMENSION;
  const longestSide = Math.max(input.width, input.height);

  if (longestSide <= maxDimension) {
    return {
      width: input.width,
      height: input.height,
    };
  }

  const scale = maxDimension / longestSide;

  return {
    width: Math.max(1, Math.round(input.width * scale)),
    height: Math.max(1, Math.round(input.height * scale)),
  };
}

export function getCompressedItemPhotoFilename(
  filename: string,
  mimeType: ItemPhotoAllowedMimeType,
): string {
  const baseName = filename.replace(/\.[^./\\]+$/, "").trim() || "item-photo";
  const extension = mimeType === "image/webp" ? "webp" : "jpg";

  return `${baseName}.${extension}`;
}

export async function prepareItemPhotoForUpload(
  file: File,
  runtime = createBrowserItemPhotoCompressionRuntime(),
  options: ItemPhotoPreparationOptions = {},
): Promise<ItemPhotoPreparationResult> {
  const isAllowedMimeType = isItemPhotoCompressibleMimeType(file.type);
  const canTranscodeUnsupportedImage =
    options.allowUnsupportedImageTranscode &&
    (file.type.startsWith("image/") || file.type === "");

  if (!isAllowedMimeType && !canTranscodeUnsupportedImage) {
    return {
      ok: false,
      code: "unsupported_file_type",
    };
  }

  if (isAllowedMimeType && !shouldCompressItemPhoto(file)) {
    return {
      ok: true,
      file,
      wasCompressed: false,
    };
  }

  const outputMimeType: ItemPhotoAllowedMimeType = isAllowedMimeType
    ? file.type
    : "image/jpeg";
  let image: ImageBitmapLike | null = null;
  let createdBlob = false;

  try {
    image = await runtime.createBitmap(file);
    const dimensions = getItemPhotoCompressionDimensions({
      width: image.width,
      height: image.height,
    });

    for (const quality of ITEM_PHOTO_COMPRESSION_QUALITIES) {
      const blob = await runtime.createBlob({
        image,
        width: dimensions.width,
        height: dimensions.height,
        mimeType: outputMimeType,
        quality,
      });

      if (!blob) {
        continue;
      }

      createdBlob = true;

      if (blob.size <= ITEM_PHOTO_MAX_SIZE_BYTES) {
        return {
          ok: true,
          file: new File(
            [blob],
            getCompressedItemPhotoFilename(file.name, outputMimeType),
            {
              lastModified: file.lastModified,
              type: outputMimeType,
            },
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
    return {
      ok: false,
      code: "compression_failed",
    };
  } finally {
    image?.close?.();
  }
}

function createBrowserItemPhotoCompressionRuntime(): ItemPhotoCompressionRuntime {
  return {
    async createBitmap(file) {
      const browserGlobals = globalThis as BrowserCompressionGlobals;

      if (typeof browserGlobals.createImageBitmap === "function") {
        try {
          return await browserGlobals.createImageBitmap(file);
        } catch {
          // Fall back to an object URL below. Mobile browsers can expose
          // createImageBitmap but still fail for camera images.
        }
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
        throw new Error("document is unavailable");
      }

      const canvas = browserGlobals.document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        return null;
      }

      context.drawImage(image.source ?? image, 0, 0, width, height);

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, mimeType, quality);
      });
    },
  };
}
