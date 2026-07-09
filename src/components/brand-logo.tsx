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
    aspectClass: "aspect-[3/1]",
    sizes: "(max-width: 640px) 240px, 320px",
    src: "/brand/logo-horizontal.png",
  },
  vertical: {
    alt: "HomeBack.app",
    aspectClass: "aspect-[0.8/1]",
    sizes: "(max-width: 640px) 180px, 220px",
    src: "/brand/logo-vertical.png",
  },
  icon: {
    alt: "HomeBack.app",
    aspectClass: "aspect-square",
    sizes: "64px",
    src: "/brand/logo-icon.png",
  },
  monochrome: {
    alt: "HomeBack.app",
    aspectClass: "aspect-[3/1]",
    sizes: "(max-width: 640px) 240px, 320px",
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
      className={`relative block w-full overflow-hidden ${config.aspectClass} ${
        className ?? ""
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
