"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Drawer } from "@/components/ui/drawer";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/utils";

export type MobileNavLink = {
  href: string;
  label: string;
};

export type MobileNavProps = {
  links: MobileNavLink[];
  cta?: ReactNode;
  secondaryCta?: ReactNode;
  className?: string;
  logoHref?: string;
};

export function MobileNav({
  links,
  cta,
  secondaryCta,
  className,
  logoHref = "/",
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-topbar backdrop-blur-md lg:hidden",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={logoHref} className="focus-ring shrink-0 rounded-lg">
          <BrandLogo asset="logo" width={120} height={32} priority />
        </Link>

        <IconButton label="Open menu" variant="outline" onClick={() => setOpen(true)}>
          <Menu className="size-5" aria-hidden />
        </IconButton>
      </div>

      <Drawer
        open={open}
        onClose={close}
        title="Mobile navigation"
        showClose
        className="bg-surface"
      >
        <div className="flex h-full flex-col gap-6">
          <Link href={logoHref} className="focus-ring w-fit rounded-lg" onClick={close}>
            <BrandLogo asset="logo" width={120} height={32} />
          </Link>

          <nav aria-label="Mobile">
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="focus-ring block rounded-lg px-3 py-3 text-body font-medium text-foreground transition-colors hover:bg-foreground/5 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {(secondaryCta || cta) && (
            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
              {secondaryCta}
              {cta}
            </div>
          )}
        </div>
      </Drawer>
    </header>
  );
}
