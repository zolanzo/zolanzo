import type { HTMLAttributes } from "react";
import { cn } from "@/utils";

export type SkeletonShape = "text" | "circle" | "rect";

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  shape?: SkeletonShape;
};

const shapeClasses: Record<SkeletonShape, string> = {
  text: "h-4 w-full max-w-xs rounded-md",
  circle: "size-10 rounded-full",
  rect: "h-24 w-full rounded-xl",
};

export function Skeleton({
  shape = "text",
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse bg-foreground/10",
        shapeClasses[shape],
        className,
      )}
      {...props}
    />
  );
}
