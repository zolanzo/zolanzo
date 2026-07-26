import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Container } from "@/components/layout/container";
import { BRAND } from "@/constants/brand";
import { cn } from "@/utils";

export type FooterLink = {
  href: string;
  label: string;
};

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export type FooterProps = {
  columns: FooterColumn[];
  legalLinks?: FooterLink[];
  className?: string;
  logoHref?: string;
};

export function Footer({
  columns,
  legalLinks = [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
  className,
  logoHref = "/",
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("border-t border-border bg-surface", className)}>
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
          <div className="flex flex-col gap-4">
            <Link href={logoHref} className="focus-ring w-fit rounded-lg">
              <BrandLogo asset="logo" width={140} height={36} />
            </Link>
            <p className="max-w-sm text-small text-muted-foreground">{BRAND.tagline}</p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-small font-semibold text-foreground">{column.title}</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="focus-ring text-small text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-muted-foreground">
            © {year} {BRAND.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="focus-ring text-caption text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
