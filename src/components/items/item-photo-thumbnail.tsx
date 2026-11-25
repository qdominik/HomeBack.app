"use client";

import { useState } from "react";
import { EntityIcon } from "@/components/icons/entity-icon";
import { ItemPhotoImage } from "./item-photo-image";

type ItemPhotoThumbnailProps = {
  alt: string;
  iconKey: string | null;
  previewUrl: string | null;
  size?: "compact" | "card";
};

export function ItemPhotoThumbnail({
  alt,
  iconKey,
  previewUrl,
  size = "compact",
}: ItemPhotoThumbnailProps) {
  const [previewFailed, setPreviewFailed] = useState(false);

  if (!previewUrl || previewFailed) {
    return (
      <span className={`mt-0.5 inline-flex shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent-soft-text ${size === "card" ? "h-18 w-18" : "h-10 w-10"}`}>
        <EntityIcon
          group="item"
          iconKey={iconKey}
          size={22}
          weight="duotone"
        />
      </span>
    );
  }

  return (
    <ItemPhotoImage
      alt={alt}
      className={`${size === "card" ? "h-18 w-18" : "h-12 w-12"} shrink-0 rounded-md border border-line`}
      onError={() => setPreviewFailed(true)}
      size={size === "card" ? 72 : 48}
      src={previewUrl}
    />
  );
}
