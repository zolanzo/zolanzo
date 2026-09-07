import Link from "next/link";
import { Navbar } from "@/components/navigation/navbar";
import { HomeFooter } from "@/components/home/home-footer";
import { WhatsAppSupportLink } from "@/components/support/whatsapp-support-link";
import { APP_CONFIG } from "@/config/app";

/**
 * Signup links to /terms and /privacy. Do not invent contractual language:
 * this repository has no approved Terms or Privacy document text.
 */
export const LEGAL_DOCUMENT_UNAVAILABLE_NOTICE =
  "The full document text is not published on this page yet. Contact ZOLANZO Support for the current documents.";

type LegalSupportPageProps = {
  heading: string;
};

export function LegalSupportPage({ heading }: LegalSupportPageProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background font-sans text-foreground">
      <Navbar />
      <main className="flex-1">
        <section className="w-full border-b border-border bg-background py-8 sm:py-12">
          <div className="mx-auto max-w-lg px-4 sm:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {heading}
            </h1>
            <div className="mt-1.5 h-1 w-12 rounded-full bg-primary" />
            <p className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
              {LEGAL_DOCUMENT_UNAVAILABLE_NOTICE}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {APP_CONFIG.supportEmail}
            </p>
            <div className="mt-8 flex flex-col items-start gap-3">
              <WhatsAppSupportLink />
              <a
                href={`mailto:${APP_CONFIG.supportEmail}`}
                className="text-sm font-semibold text-primary hover:text-primary-hover hover:underline"
              >
                {APP_CONFIG.supportEmail}
              </a>
              <Link
                href="/contact"
                className="text-sm font-semibold text-primary hover:text-primary-hover hover:underline"
              >
                Contact ZOLANZO
              </Link>
            </div>
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
