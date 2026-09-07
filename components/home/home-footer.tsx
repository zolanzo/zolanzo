import Link from "next/link";
import { ThemeLogo } from "@/components/brand/theme-logo";
import { WhatsAppSupportLink } from "@/components/support/whatsapp-support-link";

export function HomeFooter() {
  return (
    <footer className="w-full border-t border-border bg-footer pb-6 pt-10 text-foreground">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-4">
          <div className="flex flex-col items-center space-y-3 sm:items-start">
            <Link href="/">
              <ThemeLogo width={155} height={40} className="h-[36px] w-auto object-contain" />
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              Africa&apos;s premium workforce marketplace connecting micro-taskers with real digital work.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Work</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <Link href="/tasks" className="transition-colors hover:text-foreground">
                  Find Work
                </Link>
              </li>
              <li>
                <Link href="/signup" className="transition-colors hover:text-foreground">
                  Hire Talent
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="transition-colors hover:text-foreground">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Help</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <WhatsAppSupportLink variant="link" className="min-h-0 px-0 text-xs font-normal" />
              </li>
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
              <li>
                <Link href="/terms" className="transition-colors hover:text-foreground">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-foreground">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Account</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
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
          </div>
        </div>

        <div className="mt-8 space-y-1 border-t border-border pt-5 text-center text-xs text-muted-foreground">
          <p>© 2026 ZOLANZO LTD. All rights reserved.</p>
          <p className="text-[11px] text-muted-foreground">
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
