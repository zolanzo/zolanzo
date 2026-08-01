"use client";

import React from "react";
import Image from "next/image";

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
  const logoSrc = asset === "icon" ? "/brand/icon.webp" : "/brand/light-theme-logo.webp";

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Image
        src={logoSrc}
        alt="ZOLANZO Brand Logo"
        width={width}
        height={height}
        priority={priority}
        className="h-auto w-auto max-h-9 object-contain"
      />
    </div>
  );
}
