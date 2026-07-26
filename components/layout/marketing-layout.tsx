import type { ReactNode } from "react";
import Link from "next/link";
import { DesktopNav, type DesktopNavLink } from "@/components/navigation/desktop-nav";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { Footer } from "@/components/navigation/footer";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/utils";

const defaultLinks: DesktopNavLink[] = [
  { href: "/#product", label: "Product" },
  { href: "/#solutions", label: "Solutions" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/design-system", label: "Design System" },
];

export type MarketingLayoutProps = {
  children: ReactNode;
  links?: DesktopNavLink[];
  className?: string;
  hideFooter?: boolean;
};

const ctaLinkClass =
  "focus-ring inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-button font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-hover";

/**
 * Public marketing shell — sticky nav + footer.
 */
export function MarketingLayout({
  children,
  links = defaultLinks,
  className,
  hideFooter = false,
}: MarketingLayoutProps) {
  const cta = (
    <Link href="/templates/auth" className={ctaLinkClass}>
      Get started
    </Link>
  );

  return (
    <div
      className={cn(
        "bg-background text-foreground flex min-h-dvh flex-col",
        className,
      )}
    >
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <div className="hidden lg:block">
        <DesktopNav links={links} cta={cta} secondaryCta={<ThemeToggle />} />
      </div>
      <MobileNav links={links} cta={cta} secondaryCta={<ThemeToggle />} />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      {hideFooter ? null : (
        <Footer
          columns={[
            {
              title: "Product",
              links: [
                { href: "/#product", label: "Overview" },
                { href: "/#solutions", label: "Solutions" },
                { href: "/#pricing", label: "Pricing" },
              ],
            },
            {
              title: "Company",
              links: [
                { href: "/design-system", label: "Design System" },
                { href: "/templates/dashboard", label: "App Shell" },
              ],
            },
            {
              title: "Resources",
              links: [
                { href: "/templates/landing", label: "Templates" },
                { href: "/templates/auth", label: "Sign in" },
              ],
            },
          ]}
        />
      )}
    </div>
  );
}
