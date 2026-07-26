import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/utils";

export type ErrorLayoutProps = {
  children?: ReactNode;
  code?: string;
  title?: string;
  description?: string;
  className?: string;
};

/**
 * Minimal error layout for 404 / 500 / offline surfaces.
 */
export function ErrorLayout({
  children,
  code = "404",
  title = "Page not found",
  description = "The page you are looking for does not exist or has been moved.",
  className,
}: ErrorLayoutProps) {
  return (
    <div
      className={cn(
        "bg-background text-foreground flex min-h-dvh flex-col items-center justify-center px-4",
        className,
      )}
    >
      <BrandLogo asset="icon" width={48} height={48} className="mb-8" />
      <p className="text-caption text-primary mb-2 font-semibold tracking-widest uppercase">
        {code}
      </p>
      <h1 className="text-h2 text-center">{title}</h1>
      <p className="text-body text-muted-foreground mt-3 max-w-md text-center">
        {description}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="focus-ring inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-button font-semibold text-primary-foreground shadow-soft hover:bg-primary-hover"
        >
          Back home
        </Link>
        {children}
      </div>
    </div>
  );
}
