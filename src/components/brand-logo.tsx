import Image from "next/image";

type BrandLogoVariant = "horizontal" | "vertical" | "icon" | "monochrome";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  variant: BrandLogoVariant;
};

const variants: Record<
  BrandLogoVariant,
  {
    alt: string;
    aspectClass: string;
    sizes: string;
    src: string;
  }
> = {
  horizontal: {
    alt: "HomeBack.app",
    aspectClass: "aspect-[1418/489]",
    sizes: "(max-width: 640px) 208px, 256px",
    src: "/brand/homeback-logo-horizontal.png",
  },
  vertical: {
    alt: "HomeBack.app",
    aspectClass: "aspect-[4/5]",
    sizes: "(max-width: 640px) 180px, 220px",
    src: "/brand/homeback-logo-vertical.png",
  },
  icon: {
    alt: "HomeBack.app",
    aspectClass: "aspect-square",
    sizes: "64px",
    src: "/brand/homeback-icon.png",
  },
  monochrome: {
    alt: "HomeBack.app",
    aspectClass: "aspect-[3/2]",
    sizes: "(max-width: 640px) 180px, 240px",
    src: "/brand/logo-monochrome.png",
  },
};

export function BrandLogo({
  className,
  priority = false,
  variant,
}: BrandLogoProps) {
  const config = variants[variant];

  return (
    <span
      className={`relative block overflow-hidden ${config.aspectClass} ${
        className ?? "w-full"
      }`}
    >
      <Image
        fill
        alt={config.alt}
        className="object-contain"
        priority={priority}
        sizes={config.sizes}
        src={config.src}
      />
    </span>
  );
}
