"use client";

import Image from "next/image";
import { ThemeLogo } from "@/components/brand/theme-logo";
import { cn } from "@/utils";

export function BrandLogo({
  asset,
  width = 140,
  height = 36,
  className = "",
  priority,
}: {
  asset?: "logo" | "icon" | string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  if (asset === "icon") {
    return (
      <span className={cn("relative inline-flex items-center", className)}>
        <Image
          src="/brand/icon.webp"
          alt="ZOLANZO Brand Logo"
          width={width}
          height={height}
          priority={priority}
          className="h-auto w-auto object-contain"
        />
      </span>
    );
  }

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <ThemeLogo width={width} height={height} priority={priority} />
    </span>
  );
}
