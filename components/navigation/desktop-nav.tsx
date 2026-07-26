import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Container } from "@/components/layout/container";
import { cn } from "@/utils";

export type DesktopNavLink = {
  href: string;
  label: string;
};

export type DesktopNavProps = {
  links: DesktopNavLink[];
  cta?: ReactNode;
  secondaryCta?: ReactNode;
  className?: string;
  logoHref?: string;
};

export function DesktopNav({
  links,
  cta,
  secondaryCta,
  className,
  logoHref = "/",
}: DesktopNavProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-topbar backdrop-blur-md",
        className,
      )}
    >
      <Container>
        <nav
          aria-label="Main"
          className="flex h-16 items-center justify-between gap-6"
        >
          <Link href={logoHref} className="focus-ring shrink-0 rounded-lg">
            <BrandLogo asset="logo" width={140} height={36} priority />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="focus-ring rounded-lg px-3 py-2 text-small font-medium text-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 lg:flex">
            {secondaryCta}
            {cta}
          </div>
        </nav>
      </Container>
    </header>
  );
}
