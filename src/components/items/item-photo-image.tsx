"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type ItemPhotoImageProps = {
  alt: string;
  className: string;
  onError: () => void;
  size: number;
  src: string;
};

export function ItemPhotoImage({ alt, className, onError, size, src }: ItemPhotoImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paintedSource, setPaintedSource] = useState<string | null>(null);
  const hasPainted = paintedSource === src;

  function paintPhoto(image: HTMLImageElement) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !image.naturalWidth || !image.naturalHeight) return;

    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    setPaintedSource(src);
  }

  return (
    <span className={`relative inline-block overflow-hidden ${className}`}>
      <Image
        alt={alt}
        className={`ui-item-photo block size-full object-cover ${hasPainted ? "opacity-0" : ""}`}
        height={size}
        onError={onError}
        onLoad={(event) => paintPhoto(event.currentTarget)}
        src={src}
        unoptimized
        width={size}
      />
      {/* Forced darkening can recolor the image element. Draw from its decoded
          pixels and keep the original image for its fallback and alt text. */}
      <canvas
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
        height={size * 2}
        hidden={!hasPainted}
        ref={canvasRef}
        width={size * 2}
      />
    </span>
  );
}
