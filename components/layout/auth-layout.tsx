import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ThemeModeControl } from "@/components/theme/theme-toggle";
import { APP_CONFIG } from "@/config/app";
import { cn } from "@/utils";

export type AuthLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
};

/**
 * Centered authentication layout.
 */
export function AuthLayout({
  children,
  title,
  subtitle,
  className,
}: AuthLayoutProps) {
  return (
    <div
      className={cn(
        "bg-background text-foreground relative flex min-h-dvh flex-col",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_srgb,var(--primary)_12%,transparent),_transparent_55%)]"
      />

      <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="focus-ring rounded-lg" aria-label="ZOLANZO home">
          <BrandLogo asset="logo" width={140} height={36} priority />
        </Link>
        <ThemeModeControl variant="compact" />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="border-border bg-card shadow-floating w-full max-w-md rounded-2xl border p-6 sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <BrandLogo asset="monochrome" width={48} height={48} className="mb-4 opacity-90" />
            {title ? (
              <h1 className="font-heading text-h3 font-extrabold tracking-tight">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="text-muted-foreground text-small mt-1 font-medium">
                {subtitle}
              </p>
            ) : null}
          </div>
          {children}
        </div>
      </main>
      <footer className="relative z-10 px-4 py-5 text-center text-xs text-muted-foreground">
        <a
          href={APP_CONFIG.supportWhatsApp.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:text-primary-hover hover:underline"
        >
          WhatsApp Support
        </a>
      </footer>
    </div>
  );
}
