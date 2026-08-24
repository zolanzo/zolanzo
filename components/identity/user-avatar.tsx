"use client";

import React from "react";
import Image from "next/image";
import { initialsFromName } from "@/lib/money/ngn";

type UserAvatarProps = {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
};

export function UserAvatar({
  name,
  src,
  size = 40,
  className = "",
}: UserAvatarProps) {
  const initials = initialsFromName(name);
  const dim = `${size}px`;

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`object-cover ${className}`}
        style={{ width: dim, height: dim }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-foreground text-background font-bold ${className}`}
      style={{ width: dim, height: dim, fontSize: Math.max(11, size * 0.32) }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
