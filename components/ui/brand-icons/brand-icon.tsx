import React from "react";
import {
  BrandType,
  BrandVariant,
  BRAND_COLORS,
  FacebookSvg,
  InstagramSvg,
  TikTokSvg,
  YouTubeSvg,
  XSvg,
  TwitterSvg,
  WhatsAppSvg,
  TelegramSvg,
  LinkedInSvg,
  DiscordSvg,
  GoogleSvg,
  MicrosoftSvg,
  AppleSvg,
} from "./brand-svgs";

export type BrandIconSize = 24 | 32 | 40 | 48 | 56 | 64 | number;
export type BrandBackground = "none" | "white" | "soft" | "rounded" | "circle" | "glass" | "brand";

export interface BrandIconProps extends React.HTMLAttributes<HTMLDivElement> {
  brand: BrandType;
  size?: BrandIconSize;
  variant?: BrandVariant;
  background?: BrandBackground;
  className?: string;
}

const BRAND_SVG_MAP: Record<BrandType, React.ComponentType<{ size?: number; variant?: BrandVariant }>> = {
  facebook: FacebookSvg,
  instagram: InstagramSvg,
  tiktok: TikTokSvg,
  youtube: YouTubeSvg,
  x: XSvg,
  twitter: TwitterSvg,
  whatsapp: WhatsAppSvg,
  telegram: TelegramSvg,
  linkedin: LinkedInSvg,
  discord: DiscordSvg,
  google: GoogleSvg,
  microsoft: MicrosoftSvg,
  apple: AppleSvg,
};

export function BrandIcon({
  brand,
  size = 48,
  variant = "default",
  background = "none",
  className = "",
  style,
  ...props
}: BrandIconProps) {
  const SvgComponent = BRAND_SVG_MAP[brand] || GoogleSvg;
  const brandMeta = BRAND_COLORS[brand] || BRAND_COLORS.google;

  // Calculate inner SVG size relative to container size if background container is used
  const hasContainer = background !== "none";
  const innerSvgSize = hasContainer ? Math.round(size * 0.58) : size;

  // Background styling classes
  let bgClasses = "";
  const containerStyle: React.CSSProperties = { ...style };

  if (hasContainer) {
    containerStyle.width = `${size}px`;
    containerStyle.height = `${size}px`;
  }

  switch (background) {
    case "white":
      bgClasses = "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm";
      break;
    case "soft":
      bgClasses = "bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50";
      break;
    case "rounded":
      bgClasses = "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl";
      break;
    case "circle":
      bgClasses = "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 rounded-full";
      break;
    case "glass":
      bgClasses = "backdrop-blur-md bg-white/75 dark:bg-zinc-900/75 border border-white/40 dark:border-zinc-700/40 shadow-md";
      break;
    case "brand":
      if (brand === "instagram") {
        containerStyle.background = brandMeta.bg;
      } else {
        containerStyle.backgroundColor = brandMeta.bg;
      }
      bgClasses = "shadow-sm text-white";
      break;
    case "none":
    default:
      break;
  }

  // Border radius for square/soft containers if not explicitly circle or rounded
  const roundedClass =
    background === "circle"
      ? "rounded-full"
      : background === "none"
      ? ""
      : size >= 48
      ? "rounded-2xl"
      : size >= 32
      ? "rounded-xl"
      : "rounded-lg";

  // Variant classes
  let variantClasses = "";
  switch (variant) {
    case "disabled":
      variantClasses = "opacity-40 grayscale pointer-events-none";
      break;
    case "light":
      variantClasses = "opacity-80 dark:opacity-100";
      break;
    case "dark":
      variantClasses = "brightness-90 dark:brightness-110";
      break;
    case "monochrome":
      variantClasses = "text-zinc-900 dark:text-zinc-100";
      break;
    case "default":
    default:
      break;
  }

  // Pass variant override to inner SVG if background is 'brand' or variant is 'monochrome'
  const svgVariant: BrandVariant =
    background === "brand" ? "monochrome" : variant;

  if (!hasContainer) {
    return (
      <div
        className={`inline-flex items-center justify-center transition-all duration-200 ${variantClasses} ${className}`}
        style={style}
        {...props}
      >
        <SvgComponent size={size} variant={svgVariant} />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-all duration-200 ${bgClasses} ${roundedClass} ${variantClasses} ${className}`}
      style={containerStyle}
      {...props}
    >
      <SvgComponent size={innerSvgSize} variant={svgVariant} />
    </div>
  );
}

export * from "./brand-svgs";
