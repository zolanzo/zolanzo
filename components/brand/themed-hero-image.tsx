"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils";

/**
 * Hero display: full-width column capped at 480px below lg, then the 46%
 * desktop column (~620px inside the 1440px container). 2x therefore needs
 * 1280w, not 1920w.
 */
export const HERO_IMAGE_SIZES =
  "(max-width: 639px) min(480px, calc(100vw - 32px)), (max-width: 1023px) min(480px, calc(100vw - 64px)), 620px";

const LIGHT_SOURCES = {
  avifSrcSet: "/brand/lady1-640.avif 640w, /brand/lady1-1280.avif 1280w",
  webpSrcSet: "/brand/lady1-640.webp 640w, /brand/lady1-1280.webp 1280w",
  fallbackSrc: "/brand/lady1-1280.webp",
} as const;

const DARK_SOURCES = {
  avifSrcSet: "/brand/lady2-640.avif 640w, /brand/lady2-1280.avif 1280w",
  webpSrcSet: "/brand/lady2-640.webp 640w, /brand/lady2-1280.webp 1280w",
  fallbackSrc: "/brand/lady2-1280.webp",
} as const;

type ThemedHeroImageProps = {
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

function HeroPicture({
  avifSrcSet,
  webpSrcSet,
  fallbackSrc,
  alt,
  width,
  height,
  className,
  pictureClassName,
  priority,
}: {
  avifSrcSet: string;
  webpSrcSet: string;
  fallbackSrc: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  pictureClassName: string;
  priority: boolean;
}) {
  return (
    <picture className={pictureClassName}>
      <source type="image/avif" srcSet={avifSrcSet} sizes={HERO_IMAGE_SIZES} />
      <source type="image/webp" srcSet={webpSrcSet} sizes={HERO_IMAGE_SIZES} />
      <img
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={HERO_IMAGE_SIZES}
        className={className}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
        loading={priority ? "eager" : "lazy"}
      />
    </picture>
  );
}

export function ThemedHeroImage({
  alt = "ZOLANZO Hero",
  className = "",
  width = 620,
  height = 620,
  priority = true,
}: ThemedHeroImageProps) {
  const [showLight, setShowLight] = useState(false);
  const imageClassName = cn(
    "h-auto w-full select-none object-contain object-bottom transition-all duration-300 [mask-image:linear-gradient(to_bottom,black_76%,transparent_98%)]",
    className,
  );

  useEffect(() => {
    const sync = () => {
      setShowLight(!document.documentElement.classList.contains("dark"));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="group relative flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 scale-90 rounded-full bg-primary/12 blur-3xl" />
      {showLight ? (
        <HeroPicture
          {...LIGHT_SOURCES}
          alt={alt}
          width={width}
          height={height}
          priority={false}
          pictureClassName="block"
          className={cn(imageClassName, "drop-shadow-2xl")}
        />
      ) : (
        <HeroPicture
          {...DARK_SOURCES}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          pictureClassName="block"
          className={cn(imageClassName, "drop-shadow-2xl")}
        />
      )}
    </div>
  );
}
