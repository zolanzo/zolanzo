"use client";

import React from "react";
import Image from "next/image";

export type SocialPlatformType =
  | "TikTok"
  | "Instagram"
  | "Facebook"
  | "YouTube"
  | "WhatsApp"
  | "Telegram"
  | "Threads"
  | "X"
  | "LinkedIn"
  | "Website"
  | "GooglePlay"
  | "Referral"
  | "Offline";

export interface SocialIconProps {
  platform: SocialPlatformType | string;
  className?: string;
  size?: number;
  containerSize?: "sm" | "md" | "lg";
  withContainer?: boolean;
}

const SOCIAL_ICON_PATHS: Record<string, string> = {
  tiktok: "/icons/social/tiktok.svg",
  instagram: "/icons/social/instagram.svg",
  facebook: "/icons/social/facebook.svg",
  youtube: "/icons/social/youtube.svg",
  whatsapp: "/icons/social/whatsapp.svg",
  telegram: "/icons/social/telegram.svg",
  threads: "/icons/social/threads.svg",
  x: "/icons/social/x.svg",
  twitter: "/icons/social/x.svg",
  linkedin: "/icons/social/linkedin.svg",
  website: "/icons/social/website.svg",
  googleplay: "/icons/social/googleplay.svg",
  playstore: "/icons/social/googleplay.svg",
};

export function SocialIcon({
  platform,
  className = "",
  size = 32,
  containerSize = "md",
  withContainer = false,
}: SocialIconProps) {
  const key = platform.toLowerCase().replace(/[^a-z0-9]/g, "");
  const iconPath = SOCIAL_ICON_PATHS[key];

  let containerDimension = "w-[36px] h-[36px]";
  if (containerSize === "sm") containerDimension = "w-[32px] h-[32px]";
  if (containerSize === "lg") containerDimension = "w-[40px] h-[40px]";

  const iconElement = iconPath ? (
    <Image
      src={iconPath}
      alt={`${platform} official icon`}
      width={size}
      height={size}
      className={`object-contain transition-transform duration-200 group-hover:scale-105 ${className}`}
    />
  ) : (
    <div className="flex items-center justify-center font-black text-emerald-600 text-xs">
      {platform.slice(0, 2).toUpperCase()}
    </div>
  );

  if (withContainer) {
    return (
      <div
        className={`${containerDimension} rounded-2xl bg-white border border-slate-200/80 shadow-soft flex items-center justify-center shrink-0 transition-all group-hover:shadow-medium group-hover:border-emerald-500/40`}
      >
        {iconElement}
      </div>
    );
  }

  return iconElement;
}

// Alias for backward compatibility
export const SocialBrandIcon = SocialIcon;
