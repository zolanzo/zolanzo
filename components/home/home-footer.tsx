import Link from "next/link";
import { ThemeLogo } from "@/components/brand/theme-logo";

export function HomeFooter() {
  return (
    <footer className="w-full border-t border-border bg-footer pb-6 pt-12 text-foreground">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-20">
          <div className="flex max-w-sm flex-col items-center space-y-3 text-center sm:items-start sm:text-left lg:flex-1">
            <Link href="/">
              <ThemeLogo width={155} height={40} className="h-[36px] w-auto object-contain" />
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Africa&apos;s premium workforce marketplace connecting micro-taskers with real digital work.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-left sm:max-w-md sm:gap-16 lg:max-w-none lg:shrink-0">
            <nav aria-label="Help" className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                Help
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/faq" className="transition-colors hover:text-foreground">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="transition-colors hover:text-foreground">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="transition-colors hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-label="Account" className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                Account
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="transition-colors hover:text-foreground">
                    Log In
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="transition-colors hover:text-foreground">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="transition-colors hover:text-foreground">
                    Careers
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-border pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© 2026 ZOLANZO LTD. All rights reserved.</p>
          <nav aria-label="Legal" className="flex items-center gap-4">
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
          </nav>
          <p className="text-[11px]">
            A Stankings Company •{" "}
            <a
              href="https://stankings.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 transition-colors hover:text-foreground"
            >
              stankings.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
