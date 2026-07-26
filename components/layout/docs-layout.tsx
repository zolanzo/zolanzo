import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/utils";

export type DocsLayoutProps = {
  children: ReactNode;
  nav?: Array<{ href: string; label: string }>;
  className?: string;
};

const defaultNav = [
  { href: "/design-system", label: "Overview" },
  { href: "/design-system#tokens", label: "Tokens" },
  { href: "/design-system#components", label: "Components" },
  { href: "/design-system#layouts", label: "Layouts" },
];

/**
 * Documentation layout — narrow reading column + side nav.
 */
export function DocsLayout({
  children,
  nav = defaultNav,
  className,
}: DocsLayoutProps) {
  return (
    <div className={cn("bg-background text-foreground min-h-dvh", className)}>
      <header className="border-border bg-topbar sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur-md sm:px-6">
        <Link href="/" className="focus-ring rounded-lg" aria-label="ZOLANZO home">
          <BrandLogo asset="logo" width={120} height={32} priority />
        </Link>
        <ThemeToggle />
      </header>

      <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <aside className="border-border hidden w-48 shrink-0 border-r pr-6 md:block">
          <p className="text-caption text-muted-foreground mb-3">Docs</p>
          <nav aria-label="Documentation" className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring text-small hover:bg-foreground/5 rounded-md px-2 py-1.5"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
