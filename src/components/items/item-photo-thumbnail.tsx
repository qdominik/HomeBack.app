"use client";

import { useState } from "react";
import { EntityIcon } from "@/components/icons/entity-icon";
import { ItemPhotoImage } from "./item-photo-image";

type ItemPhotoThumbnailProps = {
  alt: string;
  iconKey: string | null;
  previewUrl: string | null;
};

export function ItemPhotoThumbnail({
  alt,
  iconKey,
  previewUrl,
}: ItemPhotoThumbnailProps) {
  const [previewFailed, setPreviewFailed] = useState(false);

  if (!previewUrl || previewFailed) {
    return (
      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary">
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
      className="h-12 w-12 shrink-0 rounded-md border border-line"
      onError={() => setPreviewFailed(true)}
      size={48}
      src={previewUrl}
    />
  );
}
