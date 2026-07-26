import Image from "next/image";
import type { BrandAssetKey } from "@/constants/brand";
import { getBrandPicture } from "@/lib/images/brand";

type BrandLogoProps = {
  asset?: BrandAssetKey;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

/**
 * WebP-first brand image with PNG fallback via <picture>.
 * Uses next/image for responsive sizing, lazy loading, and blur.
 */
export function BrandLogo({
  asset = "logo",
  width = 160,
  height = 40,
  className,
  priority = false,
}: BrandLogoProps) {
  const picture = getBrandPicture(asset);

  return (
    <picture>
      <source srcSet={picture.webp} type="image/webp" />
      <Image
        src={picture.png}
        alt={picture.alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes={`(max-width: 768px) ${Math.min(width, 120)}px, ${width}px`}
      />
    </picture>
  );
}
