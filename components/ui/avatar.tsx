import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils";

export type AvatarSize = "sm" | "md" | "lg";

export type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  src?: string | null;
  alt?: string;
  initials?: string;
  fallback?: ReactNode;
  size?: AvatarSize;
};

const sizeClasses: Record<AvatarSize, string> = {
  sm: "size-8 text-caption",
  md: "size-10 text-small",
  lg: "size-14 text-body",
};

export function Avatar({
  src,
  alt = "",
  initials,
  fallback,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const label = initials?.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface font-semibold text-muted-foreground",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : fallback ? (
        fallback
      ) : (
        <span aria-hidden>{label ?? "?"}</span>
      )}
    </div>
  );
}
