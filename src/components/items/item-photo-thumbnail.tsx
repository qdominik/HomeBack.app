"use client";

import Image from "next/image";
import { useState } from "react";
import { EntityIcon } from "@/components/icons/entity-icon";

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
    <Image
      alt={alt}
      className="h-12 w-12 shrink-0 rounded-md border border-line object-cover"
      height={48}
      onError={() => setPreviewFailed(true)}
      src={previewUrl}
      unoptimized
      width={48}
    />
  );
}
